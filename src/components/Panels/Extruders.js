/*
 Extruders.js - ESP3D WebUI component file
 Modified by DevMentor (2025) - High-End UX/UI Professional Muted Edition
*/

import { Fragment, h } from "preact"
import { T } from "../Translations"
import { useState, useEffect } from "preact/hooks"
import { useUiContext, useUiContextFn } from "../../contexts"
import { Button, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useHttpFn } from "../../hooks"
import { espHttpURL } from "../Helpers"
import { iconsTarget } from "SubTargetDir"
import { Send, Sliders, ChevronsUp, ChevronsDown, Play, StopCircle, Tool, Octagon } from "preact-feather"

// --- PERSISTENT STATE ---
let persistentMixRatio = [100, 0];
let persistentPrepareFeedrate = 5000;
let persistentStartFeedrate = 5000;

// ==========================================
// 1. MODERN CSS STYLES (CSS-IN-JS)
// ==========================================
const styles = `
    /* --- KART GENEL YAPISI --- */
    .control-card {
        border-radius: 12px;
        padding: 12px 15px;
        margin-bottom: 10px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        border: 1px solid transparent;
        transition: all 0.2s ease;
    }
    
    /* PASTEL RENKLER (Göz Yormayan) */
    .card-mixer { background-color: #f8fafc; border-color: #e2e8f0; } /* Slate/Gri Ton */
    .card-ram { background-color: #fff7ed; border-color: #ffedd5; } /* Soft Cream */
    .card-clay { background-color: #f0fdf4; border-color: #dcfce7; } /* Soft Green */

    .card-header {
        font-size: 0.8rem;
        font-weight: 800;
        color: #64748b;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
    }

    /* --- SLIDER --- */
    .modern-slider {
        -webkit-appearance: none;
        width: 100%;
        height: 5px;
        border-radius: 5px;
        background: #cbd5e1; /* Daha nötr gri */
        outline: none;
        transition: background 0.2s;
        margin: 5px 0 15px 0;
    }
    .modern-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #475569; /* Slate thumb */
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        transition: transform 0.1s;
    }
    .modern-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

    /* --- INPUT --- */
    .modern-input-group {
        display: flex;
        align-items: center;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 2px 4px;
        transition: border-color 0.2s;
    }
    .modern-input-group:focus-within {
        border-color: #94a3b8 !important;
        box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.1);
    }
    .modern-input {
        border: none;
        background: transparent;
        width: 100%;
        padding: 6px;
        font-weight: 700;
        font-size: 0.9rem;
        color: #334155;
        outline: none;
        text-align: center;
    }

    /* --- ETİKETLER --- */
    .ratio-label-container { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .ratio-label { display: flex; flex-direction: column; }
    .ratio-title { font-size: 0.7rem; font-weight: 800; color: #475569; text-transform: uppercase; }
    .ratio-sub { font-size: 0.6rem; color: #94a3b8; font-weight: 600; }

    /* --- BUTONLAR (GRID) --- */
    .action-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .action-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 10px 4px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.7rem;
        width: 100%;
        white-space: nowrap;
    }
    
    .btn-secondary { 
        background: #fff; 
        color: #64748b; 
        border: 1px solid #e2e8f0; 
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .btn-secondary:hover { 
        background: #f8fafc; 
        color: #334155; 
        border-color: #cbd5e1; 
        transform: translateY(-1px); 
    }

    /* STOP (KÜÇÜK) - GHOST STİL */
    .btn-danger-outline {
        background: #fff;
        color: #ef4444;
        border: 1px solid #fecaca;
        box-shadow: 0 1px 2px rgba(239, 68, 68, 0.05);
    }
    .btn-danger-outline:hover {
        background: #fee2e2;
        border-color: #ef4444;
        transform: translateY(-1px);
    }

    /* --- START / STOP ANA BUTONLAR (SAKİNLEŞTİRİLMİŞ) --- */
    
    /* Start: "Muted Slate Blue" - Cırtlak mavi yerine sakin, profesyonel mavi/gri */
    .btn-start-muted {
        background-color: #e0f0e2ff; /* Slate 600 */
        color: #64748b;
        border: 1px solid #cfcfcfff;
        box-shadow: 0 2px 4px rgba(71, 85, 105, 0.2);
    }
    .btn-start-muted:hover {
        background-color: #d2e0d4ff; /* Slate 700 */
        transform: translateY(-1px);
        color: #334155;
    }

    /* Global Stop: "Ghost Outline" - Kırmızı zemin yerine beyaz zemin, kırmızı yazı */
    .btn-stop-ghost {
        background-color: #fff;
        color: #dc2626; /* Dark Red Text */
        border: 2px solid #fee2e2; /* Light Red Border */
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .btn-stop-ghost:hover {
        background-color: #fef2f2;
        border-color: #ef4444;
        color: #b91c1c;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(239, 68, 68, 0.1);
    }

    /* --- SEND BUTTON --- */
    .send-icon-btn {
        width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
        border-radius: 8px; background: #64748b; color: white; cursor: pointer; transition: all 0.2s;
    }
    .send-icon-btn:hover { background: #475569; transform: scale(1.05); }
`;

const ExtrudersPanel = () => {
    const { toasts } = useUiContext()
    const { createNewRequest } = useHttpFn

    // --- STATE ---
    const [mixRatio, setMixRatio] = useState(persistentMixRatio);
    const [prepareFeedrate, setPrepareFeedrate] = useState(persistentPrepareFeedrate);
    const [startFeedrate, setStartFeedrate] = useState(persistentStartFeedrate);

    const id = "extrudersPanel";

    // --- QUEUE SYSTEM ---
    const executeCommandFromQueue = (commandQueue) => {
        if (commandQueue.length === 0) {
            toasts.addToast({ content: "Done.", type: "success" });
            return;
        }
        const [nextCommand, ...remainingCommands] = commandQueue;
        const cmd = nextCommand.trim().toUpperCase();
        if (cmd === "") { executeCommandFromQueue(remainingCommands); return; }
        
        createNewRequest(
            espHttpURL("command", { cmd: cmd }),
            { method: "GET", echo: cmd },
            {
                onSuccess: () => { setTimeout(() => executeCommandFromQueue(remainingCommands), 250); },
                onFail: (error) => { toasts.addToast({ content: `Err: ${cmd}`, type: "error" }); },
            }
        );
    };

    const SendCommand = (commandString) => {
        const commands = commandString.split('\n');
        if (commands.length > 0) executeCommandFromQueue(commands);
    };

    // --- HANDLERS ---
    const sendMixCommand = () => {
        const val1 = (mixRatio[0] / 100.0).toFixed(2);
        const val2 = (mixRatio[1] / 100.0).toFixed(2);
        SendCommand(`M163 S0 P${val1}\nM163 S1 P${val2}\nM164 S0`);
    };
    
    const handleSliderChange = (e) => {
        const val = parseInt(e.target.value, 10);
        const newRatio = [100 - val, val];
        setMixRatio(newRatio);
        persistentMixRatio = newRatio;
    };
    
    const handleBoxChange = (idx, value) => {
        let val = parseInt(value, 10);
        if (isNaN(val)) val = 0; if (val < 0) val = 0; if (val > 100) val = 100;
        let newRatio = idx === 0 ? [val, 100 - val] : [100 - val, val];
        setMixRatio(newRatio);
        persistentMixRatio = newRatio;
    };

    const handleScrewForward = () => {
        setMixRatio([0, 100]); persistentMixRatio = [0, 100];
        SendCommand(`M410\nG92 E0\nM221 S100\nM220 S100\nT1\nG1 E100000 F${prepareFeedrate}`);
    };

    const handleScrewRetraction = () => {
        setMixRatio([0, 100]); persistentMixRatio = [0, 100];
        SendCommand(`M410\nG92 E0\nM221 S100\nM220 S100\nT1\nG1 E-100000 F${prepareFeedrate}`);
    };

    const handleStartExtruder = () => {
        sendMixCommand();
        SendCommand(`M410\nG92 E0\nM221 S100\nM220 S100\nT0 T1\nG1 E100000 F${startFeedrate}`);
    };

    const handleStop = () => {
        SendCommand("M410");
        toasts.addToast({ content: "STOP SENT!", type: "warning" });
    };

    return (
        <div class="panel panel-dashboard" id={id}>
            <style>{styles}</style>
            <ContainerHelper id={id} /> 
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    {iconsTarget["Extruder"]}
                    <strong class="text-ellipsis">Prepare For Printing</strong>
                </span>
                <span class="navbar-section">
                    <span class="H-100">
                        <FullScreenButton elementId={id} />
                        <CloseButton elementId={id} hideOnFullScreen={true} />
                    </span>
                </span>
            </div>

            <div class="panel-body panel-body-dashboard" style={{ backgroundColor: '#fcfcfc', padding: '10px' }}>
                
                {/* 1. KART: MIKSER KONTROLÜ (GRI/SLATE) */}
                <div className="control-card card-mixer">
                    <div className="card-header">
                        <Sliders size="14"/> Mixer Ratio
                    </div>
                    
                    <div style={{ padding: '0 5px' }}>
                        <div className="ratio-label-container">
                            <div className="ratio-label" style={{ alignItems: 'flex-start' }}>
                                <span className="ratio-title">KİL EKSTRUDER</span>
                                <span className="ratio-sub">E0 (Aktif)</span>
                            </div>
                            <div className="ratio-label" style={{ alignItems: 'flex-end' }}>
                                <span className="ratio-title">RAM (DEPO)</span>
                                <span className="ratio-sub">E1 (Pasif)</span>
                            </div>
                        </div>

                        <input 
                            className="modern-slider" type="range" min="0" max="100" 
                            value={100 - mixRatio[0]} 
                            onInput={handleSliderChange} onChange={sendMixCommand}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div className="modern-input-group" style={{ flex: 1 }}>
                            <input className="modern-input" type="number" value={mixRatio[0]} 
                                onInput={(e) => handleBoxChange(0, e.target.value)} onKeyUp={(e) => e.key === 'Enter' && sendMixCommand()}
                            />
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', paddingRight: '6px' }}>%</span>
                        </div>
                        
                        <div style={{ fontWeight: 'bold', color: '#cbd5e1' }}>:</div>

                        <div className="modern-input-group" style={{ flex: 1 }}>
                            <input className="modern-input" type="number" value={mixRatio[1]}
                                onInput={(e) => handleBoxChange(1, e.target.value)} onKeyUp={(e) => e.key === 'Enter' && sendMixCommand()}
                            />
                             <span style={{ fontSize: '0.7rem', color: '#94a3b8', paddingRight: '6px' }}>%</span>
                        </div>
                        
                        <div className="send-icon-btn" onClick={sendMixCommand} title="Apply">
                            <Send size="16"/>
                        </div>
                    </div>
                </div>

                {/* 2. KART: RAM EXTRUDER (SOFT KREM) */}
                <div className="control-card card-ram">
                    <div className="card-header">
                        <Tool size="14"/> Ram Extruder (Depo-Çamur Haznesi)
                    </div>

                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748b' }}>Feedrate:</label>
                        <div className="modern-input-group" style={{ width: '60%' }}>
                            <input className="modern-input" style={{ padding: '4px' }} type="number" value={prepareFeedrate} 
                                onInput={(e) => { setPrepareFeedrate(e.target.value); persistentPrepareFeedrate = e.target.value; }} />
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', paddingRight: '6px' }}>mm/min</span>
                        </div>
                    </div>

                    {/* 3 KOLONLU GRID: İLERİ | DUR | GERİ */}
                    <div className="action-grid-3">
                        <button className="action-btn btn-secondary" onClick={handleScrewForward}>
                            <ChevronsUp size="16"/> Forward
                        </button>
                        
                        <button className="action-btn btn-danger-outline" onClick={handleStop}>
                            <Octagon size="16"/> STOP
                        </button>

                        <button className="action-btn btn-secondary" onClick={handleScrewRetraction}>
                            <ChevronsDown size="16"/> Retract
                        </button>
                    </div>
                </div>
                
                {/* 3. KART: CLAY EXTRUDER (SOFT YEŞİL) */}
                <div className="control-card card-clay">
                    <div className="card-header">
                        <Play size="14"/> Clay Extruder (Kil Ekstruder-Baskı Kafası)
                    </div>

                     <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748b' }}>Feedrate:</label>
                        <div className="modern-input-group" style={{ width: '60%' }}>
                            <input className="modern-input" style={{ padding: '4px' }} type="number" value={startFeedrate} 
                                onInput={(e) => { setStartFeedrate(e.target.value); persistentStartFeedrate = e.target.value; }} />
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', paddingRight: '6px' }}>mm/min</span>
                        </div>
                    </div>

                    {/* 2 KOLONLU GRID: START (MUTED) | STOP (GHOST) */}
                    <div className="action-grid-2">
                         <button className="action-btn btn-start-muted" onClick={handleStartExtruder} style={{ padding: '12px 4px' }}>
                            <Play size="18" fill="currentColor" style={{ opacity: 0.6 }}/> Start Clay Extruder
                        </button>

                         <button className="action-btn btn-stop-ghost" onClick={handleStop} style={{ padding: '12px 4px' }}>
                            <StopCircle size="18"/> Stop Extruder
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}

const ExtrudersPanelElement = {
    id: "extrudersPanel",
    content: <ExtrudersPanel />,
    name: "P36",
    icon: "Extruder",
    show: "showextruderspanel",
    onstart: "openextrudersonstart",
    settingid: "extruders",
}

export { ExtrudersPanel, ExtrudersPanelElement }