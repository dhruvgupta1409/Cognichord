from __future__ import annotations
import numpy as np
from brian2 import (
    start_scope, NeuronGroup, Synapses, PoissonGroup, SpikeMonitor, StateMonitor,
    PopulationRateMonitor, Network, run, defaultclock, prefs, seed as brian_seed,
    mV, ms, second, nS, pF, Hz, Mohm,
)

prefs.codegen.target = "numpy"

N_CTX = 80
N_STR = 40
N_INH = 20

C_m   = 200 * pF
g_L   = 10 * nS
E_L   = -70 * mV
V_th  = -50 * mV
V_re  = -60 * mV
E_ex  = 0 * mV
E_in  = -80 * mV
tau_ampa = 5 * ms
tau_gaba = 10 * ms
t_ref = 2 * ms

U_se      = 0.45
tau_rec   = 500 * ms
tau_facil = 25 * ms

NET_U        = 0.2
NET_TAU_REC  = 150 * ms
NET_TAU_FACIL = 60 * ms

tau_pre  = 20 * ms
tau_post = 20 * ms
tau_elig = 1.0 * second
A_pre    = 0.020
A_post   = 0.024


def _protocol_from_params(params: dict) -> dict:
    reps = int(params.get("repetitions", 24))
    reps = max(6, min(48, reps))
    difficulty = float(params.get("difficulty", 0.5))
    difficulty = min(1.0, max(0.0, difficulty))
    focus = float(params.get("focus", 0.6))
    focus = min(1.0, max(0.0, focus))
    return {"reps": reps, "difficulty": difficulty, "focus": focus,
            "seed": int(params.get("seed", 1)) & 0x7FFFFFFF}


def run_consolidation(params: dict) -> dict:
    cfg = _protocol_from_params(params)
    reps = cfg["reps"]
    brian_seed(cfg["seed"])
    np.random.seed(cfg["seed"])
    start_scope()
    defaultclock.dt = 0.1 * ms

    trial_dur = 200 * ms
    n_warmup = 1
    total_trials = reps + n_warmup
    focus_gain = 0.7 + 0.6 * cfg["focus"]
    target_frac = 0.7 - 0.35 * cfg["difficulty"]

    v_size = N_CTX // 8
    ctx_idx, ctx_t = [], []
    for tr in range(total_trials):
        base = tr * (trial_dur / ms)
        for v in range(8):
            phase = 20 + v * 9
            for n in range(v_size):
                nid = v * v_size + n
                ctx_idx.append(nid); ctx_t.append(base + phase)
                ctx_idx.append(nid); ctx_t.append(base + phase + 3)

    lif = """
    dv/dt = (g_L*(E_L - v) + g_ex*(E_ex - v) + g_in*(E_in - v)) / C_m : volt (unless refractory)
    dg_ex/dt = -g_ex/tau_ampa : siemens
    dg_in/dt = -g_in/tau_gaba : siemens
    """
    striatum = NeuronGroup(N_STR, lif, threshold="v>V_th", reset="v=V_re",
                           refractory=t_ref, method="euler")
    striatum.v = E_L
    inh = NeuronGroup(N_INH, lif, threshold="v>V_th", reset="v=V_re",
                      refractory=t_ref, method="euler")
    inh.v = E_L

    from brian2 import SpikeGeneratorGroup
    cortex = SpikeGeneratorGroup(N_CTX, np.array(ctx_idx, dtype=int), np.array(ctx_t) * ms)

    cs_model = """
    w : 1                                             # synaptic weight (plastic)
    du_tm/dt = -u_tm/NET_TAU_FACIL : 1 (event-driven) # facilitation (release prob)
    dx_tm/dt = (1 - x_tm)/NET_TAU_REC : 1 (event-driven)  # available vesicle resources
    dapre/dt  = -apre/tau_pre : 1 (event-driven)      # STDP presynaptic trace
    dapost/dt = -apost/tau_post : 1 (event-driven)    # STDP postsynaptic trace
    delig/dt  = -elig/tau_elig : 1 (clock-driven)     # eligibility tag (three-factor)
    """
    g_scale = 22.0 * focus_gain
    cs_on_pre = """
    u_tm += NET_U*(1 - u_tm)
    rel = u_tm * x_tm
    g_ex_post += w * rel * g_scale * nS
    x_tm -= rel
    apre += A_pre
    elig += -apost
    """
    cs_on_post = """
    apost += A_post
    elig += apre
    """
    cs = Synapses(cortex, striatum, model=cs_model, on_pre=cs_on_pre, on_post=cs_on_post, method="euler")
    cs.connect(p=0.22)
    cs.w = "0.30 + 0.05*rand()"
    cs.u_tm = NET_U
    cs.x_tm = 1.0
    cs.elig = 0.0

    ci = Synapses(cortex, inh, on_pre="g_ex_post += 1.0*nS"); ci.connect(p=0.15)
    istr = Synapses(inh, striatum, on_pre="g_in_post += 1.6*nS"); istr.connect(p=0.25)
    iself = Synapses(inh, inh, on_pre="g_in_post += 1.5*nS"); iself.connect(p=0.3)

    str_spikes = SpikeMonitor(striatum)
    ctx_spikes = SpikeMonitor(cortex)
    vmon = StateMonitor(striatum, "v", record=[0])
    ratemon = PopulationRateMonitor(striatum)

    net = Network(cortex, striatum, inh, cs, ci, istr, iself,
                  str_spikes, ctx_spikes, vmon, ratemon)

    n_target = max(4, int(round(N_STR * target_frac)))
    target_ids = np.arange(n_target)

    net.run(trial_dur)
    cs.elig = 0.0

    weight_curve, response_curve, dopa_curve, rpe_curve = [], [], [], []
    predicted = 0.0
    raster_first, raster_last = None, None
    eta = 6.0

    for trial in range(reps):
        t0 = net.t
        base_spikes = str_spikes.num_spikes
        net.run(trial_dur)

        i_all = np.asarray(str_spikes.i)
        t_all = np.asarray(str_spikes.t / ms)
        mask = t_all >= (t0 / ms)
        i_tr, t_tr = i_all[mask], t_all[mask]
        target_hits = np.isin(i_tr, target_ids).sum()
        performance = float(min(1.0, target_hits / (n_target * 4.0)))

        reward = performance
        rpe = reward - predicted
        predicted = float(np.clip(predicted + 0.2 * rpe, 0.0, 1.0))
        dopa = max(0.0, rpe) + 0.12 * reward

        elig = np.asarray(cs.elig)
        w = np.asarray(cs.w)
        w = np.clip(w + eta * elig * dopa, 0.0, 1.5)
        cs.w = w
        cs.elig = 0.0

        weight_curve.append(float(w.mean()))
        response_curve.append(performance)
        dopa_curve.append(float(dopa))
        rpe_curve.append(float(rpe))

        if trial == 0:
            raster_last = None
            raster_first = _raster(ctx_spikes, str_spikes, t0, net.t)
        if trial == reps - 1:
            raster_last = _raster(ctx_spikes, str_spikes, t0, net.t)

    stp = _tsodyks_markram_demo()

    hh = _hodgkin_huxley_spike()

    vt = np.asarray(vmon.t / ms)
    vv = np.asarray(vmon.v[0] / mV)
    keep = vt >= (vt[-1] - 120)
    vm_trace = {"t": _round(vt[keep] - vt[keep][0], 2), "v": _round(vv[keep], 2)}

    return {
        "meta": {
            "model": "Cortico-striatal COBA-LIF · Tsodyks-Markram release · reward-modulated STDP",
            "engine": "Brian2 2.5.4",
            "neurons": {"cortex": N_CTX, "striatum": N_STR, "inhibitory": N_INH},
            "synapses": int(len(cs.w)),
            "trials": reps,
            "protocol": cfg,
            "citations": [
                "Tsodyks & Markram (1997) PNAS — dynamic synaptic transmission",
                "Bi & Poo (1998) J Neurosci — STDP",
                "Izhikevich (2007) Cereb Cortex — DA-modulated STDP with eligibility traces",
                "Schultz, Dayan & Montague (1997) Science — dopamine reward-prediction error",
                "Brunel & Wang (2001); Vogels & Abbott (2005) — COBA LIF networks",
            ],
        },
        "learning": {
            "trial": list(range(1, reps + 1)),
            "weight": _round(weight_curve, 4),
            "response": _round(response_curve, 4),
            "dopamine": _round(dopa_curve, 4),
            "rpe": _round(rpe_curve, 4),
        },
        "raster_first": raster_first,
        "raster_last": raster_last,
        "stp": stp,
        "vm": vm_trace,
        "hh": hh,
    }


def _raster(ctx_mon: SpikeMonitor, str_mon: SpikeMonitor, t0, t1) -> dict:
    def slice_mon(mon):
        i = np.asarray(mon.i); t = np.asarray(mon.t / ms)
        m = (t >= t0 / ms) & (t < t1 / ms)
        return {"i": i[m].astype(int).tolist(), "t": _round(t[m] - t0 / ms, 1)}
    return {"cortex": slice_mon(ctx_mon), "striatum": slice_mon(str_mon),
            "window_ms": float((t1 - t0) / ms)}


def _tsodyks_markram_demo() -> dict:
    from brian2 import SpikeGeneratorGroup
    start_scope()
    defaultclock.dt = 0.1 * ms
    rate_hz = 20
    isi = 1000.0 / rate_hz
    n_spk = 12
    times = (np.arange(n_spk) * isi + 20.0) * ms
    drive = SpikeGeneratorGroup(1, np.zeros(n_spk, dtype=int), times)
    post = NeuronGroup(1, "dg/dt = -g/(5*ms) : 1", method="euler")
    S = Synapses(drive, post,
                 """du_tm/dt = -u_tm/tau_facil : 1 (clock-driven)
                    dx_tm/dt = (1 - x_tm)/tau_rec : 1 (clock-driven)
                    rel_out : 1""",
                 on_pre="""u_tm += U_se*(1-u_tm)
                           rel_out = u_tm*x_tm
                           g_post += rel_out
                           x_tm -= rel_out""",
                 method="euler")
    S.connect(); S.u_tm = U_se; S.x_tm = 1.0
    relmon = StateMonitor(S, ["u_tm", "x_tm", "rel_out"], record=0, when="after_synapses", dt=0.5 * ms)
    net = Network(drive, post, S, relmon)
    net.run((n_spk * isi + 120) * ms)
    t = np.asarray(relmon.t / ms)
    u = np.asarray(relmon.u_tm[0]); x = np.asarray(relmon.x_tm[0]); rel = np.asarray(relmon.rel_out[0])
    spikes = []
    for k in range(n_spk):
        ts = float(times[k] / ms)
        idx = int(np.searchsorted(t, ts + 0.3))
        idx = min(idx, len(rel) - 1)
        spikes.append({"t": round(ts, 1), "released": round(float(rel[idx]), 4)})
    step = max(1, len(t) // 300)
    return {
        "t": _round(t[::step], 1),
        "u": _round(u[::step], 4),
        "x": _round(x[::step], 4),
        "spikes": spikes,
        "rate_hz": rate_hz,
        "note": "Depressing synapse: each spike releases u·x of the vesicle pool; x depletes faster than it recovers, so successive releases run down.",
    }


def _hodgkin_huxley_spike() -> dict:
    from brian2 import umetre, cm, ufarad, msiemens, siemens, nA, amp
    start_scope()
    defaultclock.dt = 0.01 * ms
    area = 20000 * umetre ** 2
    Cm = 1 * ufarad * cm ** -2 * area
    gl = 5e-5 * siemens * cm ** -2 * area
    El = -65 * mV; EK = -90 * mV; ENa = 50 * mV; VT = -63 * mV
    g_na = 100 * msiemens * cm ** -2 * area
    g_kd = 30 * msiemens * cm ** -2 * area
    eqs = """
    dv/dt = (gl*(El-v) - g_na*(m*m*m)*h*(v-ENa) - g_kd*(n*n*n*n)*(v-EK) + I)/Cm : volt
    dm/dt = 0.32*(mV**-1)*(13.*mV-v+VT)/
        (exp((13.*mV-v+VT)/(4.*mV))-1.)/ms*(1-m)-0.28*(mV**-1)*(v-VT-40.*mV)/
        (exp((v-VT-40.*mV)/(5.*mV))-1.)/ms*m : 1
    dn/dt = 0.032*(mV**-1)*(15.*mV-v+VT)/
        (exp((15.*mV-v+VT)/(5.*mV))-1.)/ms*(1.-n)-.5*exp((10.*mV-v+VT)/(40.*mV))/ms*n : 1
    dh/dt = 0.128*exp((17.*mV-v+VT)/(18.*mV))/ms*(1.-h)-4./(1+exp((40.*mV-v+VT)/(5.*mV)))/ms*h : 1
    I : amp
    """
    neuron = NeuronGroup(1, eqs, method="exponential_euler", threshold="v>-20*mV", refractory="v>-40*mV")
    neuron.v = El; neuron.h = 1; neuron.m = 0; neuron.n = 0
    mon = StateMonitor(neuron, ["v", "m", "h", "n"], record=0, dt=0.05 * ms)
    net = Network(neuron, mon)
    net.run(8 * ms)
    neuron.I = 0.6 * nA
    net.run(34 * ms)
    neuron.I = 0 * nA
    net.run(8 * ms)
    t = np.asarray(mon.t / ms)
    return {
        "t": _round(t, 2),
        "v": _round(mon.v[0] / mV, 2),
        "m": _round(mon.m[0], 3),
        "h": _round(mon.h[0], 3),
        "n": _round(mon.n[0], 3),
        "note": "Hodgkin-Huxley neuron, 0.6 nA current step (8-42 ms). Na⁺ activation (m) opens fast to depolarise; inactivation (h) and K⁺ (n) repolarise.",
    }


def _round(arr, nd):
    return [round(float(v), nd) for v in np.asarray(arr)]


if __name__ == "__main__":
    import json, time
    t = time.time()
    out = run_consolidation({"repetitions": 24, "difficulty": 0.6, "focus": 0.7, "seed": 3})
    print("elapsed %.1fs" % (time.time() - t))
    print("weight  :", out["learning"]["weight"])
    print("response:", out["learning"]["response"])
    print("dopamine:", out["learning"]["dopamine"])
    print("stp spikes :", len(out["stp"]["spikes"]), "first/last released:",
          out["stp"]["spikes"][0]["released"], out["stp"]["spikes"][-1]["released"])
    print("raster last striatal spikes:", len(out["raster_last"]["striatum"]["t"]))
    print("json bytes:", len(json.dumps(out)))
