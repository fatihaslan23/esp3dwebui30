/*
Jog.js - ESP3D WebUI component file
Modified by DevMentor (2025) - Anti-Zoom & Rapid Click Fix
*/

import { Fragment, h } from "preact"
import { Move, Home, ZapOff, Edit3, Plus, Edit, Trash2, ChevronUp, ChevronDown, Send, Activity, Wind, Command, Minus, Plus as PlusIcon } from "preact-feather" 
import { useHttpFn } from "../../hooks"
import { espHttpURL } from "../Helpers"
import { useUiContext, useUiContextFn } from "../../contexts"
import { T } from "../Translations"
import {
    Button,
    FullScreenButton,
    CloseButton,
    ContainerHelper,
} from "../Controls"
import { useEffect, useState, useRef } from "preact/hooks"
import { showModal } from "../Modal"
import { useTargetContext } from "../../targets"

// ==========================================
// 1. CSS STYLES (NO ZOOM & RAPID CLICK)
// ==========================================
const styles = `
    /* --- GENEL --- */
    #jogPanel.panel {
        background-color: #f2f4f8 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .control-card {
        background-color: #fff;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        margin-bottom: 16px;
        border: 1px solid rgba(0,0,0,0.02);
    }

    .card-header {
        font-size: 0.75rem;
        font-weight: 800;
        color: #8c9bab;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
        display: flex; align-items: center; gap: 8px;
    }

    /* --- STEPPER (Flow & Speed) --- */
    .stepper-top-row {
        display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    }

    .stepper-action-btn {
        width: 48px; height: 48px;
        background-color: #fff; border: 1px solid #eef2f6; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        color: #3b82f6; cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: transform 0.1s, background-color 0.2s; flex-shrink: 0;
        
        /* KRİTİK AYARLAR: ZOOM VE SEÇİMİ ENGELLER */
        touch-action: manipulation; 
        user-select: none;
        -webkit-user-select: none;
    }
    .stepper-action-btn:active { transform: scale(0.90); background-color: #f0f9ff; }
    
    .stepper-display {
        flex-grow: 1; background-color: #f8fafc; border-radius: 12px;
        height: 48px; display: flex; align-items: center; justify-content: center; position: relative;
    }

    .stepper-input {
        width: 100%; background: transparent; border: none; text-align: center;
        font-size: 1.3rem; font-weight: 700; color: #1e293b; outline: none; z-index: 2;
        /* Input içinde zoom olmasın */
        touch-action: manipulation;
    }
    .stepper-unit { position: absolute; right: 12px; font-size: 0.8rem; color: #94a3b8; font-weight: 600; }

    .stepper-presets { display: flex; gap: 8px; }
    .preset-btn {
        flex: 1; background-color: #f1f5f9; color: #64748b;
        font-size: 0.8rem; font-weight: 600; padding: 8px 0;
        border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s;
        
        /* ZOOM ENGELLEME */
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
    }
    .preset-btn:hover{background-color: #aac9fcff;}
    .preset-btn.active { background-color: #3b82f6; color: #fff; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); }
    .preset-btn:active { transform: scale(0.95); }

    /* --- ACTION BUTTONS --- */
    .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 16px; }
    .big-btn {
        background-color: #fff; border-radius: 16px; height: 70px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03); cursor: pointer; transition: all 0.2s; gap: 6px;
        
        /* ZOOM ENGELLEME */
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
    }
    .big-btn:active { transform: scale(0.96); }
    .btn-home { color: #0e8b07; background-color: #ffffff;}
    .btn-home:hover { color: #056600; background-color: #a4db9dff; }
    .btn-off { color: #ef4444; }
    .btn-off:hover { background-color: #fef2f2; }
    .btn-label { font-size: 0.8rem; font-weight: 700; }

    /* --- Z-AXIS CONTROL --- */
    .z-axis-layout { display: flex; flex-direction: column; gap: 12px; }
    .z-actions-row { display: flex; gap: 15px; }
    .z-jog-btn {
        flex: 1; height: 60px; background-color: #eff6ff; border-radius: 12px;
        color: #3b82f6; display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: transform 0.1s;
        
        /* ZOOM ENGELLEME */
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
    }
    .z-jog-btn:hover{background-color: #7aa9f5ff; color: #ffffff;}
    .z-jog-btn:active { background-color: #dbeafe; transform: scale(0.96); }

    /* --- CUSTOM COMMANDS --- */
    .cmd-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .cmd-tag {
        background-color: #f1f5f9; padding: 6px 12px; border-radius: 20px;
        font-size: 0.8rem; font-weight: 600; color: #475569;
        display: flex; align-items: center; gap: 6px; cursor: pointer; border: 1px solid transparent;
        
        /* ZOOM ENGELLEME */
        touch-action: manipulation;
        user-select: none;
    }
    .cmd-tag:hover { background-color: #fff; border-color: #cbd5e1; }

    .panel-container-width { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; }
`;

// ==========================================
// HELPERS
// ==========================================
const target_values = [[], [], []]

const isVisible = (pos) => {
    const setting = ["showfanctrls", "showflowratectrls", "showspeedctrls"]
    return setting[pos] != undefined ? useUiContextFn.getValue(setting[pos]) : false
}

const controlCommand = (pos, index, value) => {
    const setting = ["fancmd", "flowratecmd", "speedcmd"]
    if (setting[pos] != undefined) {
        const cmd = useUiContextFn.getValue(setting[pos])
        if (cmd)
            return cmd.replace("#", index).replace("$", pos == 0 ? (parseInt(value) * 255) / 100 : value)
    }
    return ""
}

// ==========================================
// COMPONENT: ERGO INPUT
// ==========================================
const ErgoInputControl = ({ element, index, pos, icon, label }) => {
    if (!isVisible(pos)) return null 
    
    const { toasts } = useUiContext()
    const { createNewRequest } = useHttpFn
    const [step, setStep] = useState(5);
    
    if (typeof target_values[pos][index] == "undefined") {
        target_values[pos][index] = {}
        target_values[pos][index].current =
            typeof element.list.current[index] == "undefined" || element.list.current[index] == -1
                ? (pos == 0 ? 0 : 100)
                : element.list.current[index]
    }
    const [localValue, setLocalValue] = useState(target_values[pos][index].current);

    const sendCommand = (val) => {
        const cmds = controlCommand(pos, index, val).split(";")
        cmds.forEach(cmd => {
            createNewRequest(
                espHttpURL("command", { cmd: cmd }),
                { method: "GET", echo: cmd },
                { onSuccess: () => {}, onFail: (err) => toasts.addToast({ content: err, type: "error" }) }
            )
        })
        element.list.current[index] = val;
        target_values[pos][index].current = val;
    }
    
    const changeValue = (factor) => {
        useUiContextFn.haptic();
        let newVal = parseInt(localValue) + (factor * step);
        if (newVal < 0) newVal = 0;
        setLocalValue(newVal);
        sendCommand(newVal);
    };

    const handleManualInput = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendCommand(e.target.value);
            e.target.blur();
        }
    };

    return (
        <div className="control-card">
            <div className="card-header">{icon} {label}</div>
            <div className="stepper-top-row">
                <div className="stepper-action-btn" onClick={() => changeValue(-1)}><Minus size="24" /></div>
                <div className="stepper-display">
                    <input className="stepper-input" type="number" value={localValue} onInput={(e) => setLocalValue(e.target.value)} onKeyDown={handleManualInput} />
                    <span className="stepper-unit">%</span>
                </div>
                <div className="stepper-action-btn" onClick={() => changeValue(1)}><PlusIcon size="24" /></div>
            </div>
            <div className="stepper-presets">
                {[1, 5, 10].map(val => (
                    <div key={val} className={`preset-btn ${step === val ? 'active' : ''}`} onClick={() => { useUiContextFn.haptic(); setStep(val); }}>
                        ±{val}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ==========================================
// COMPONENT: MAIN JOG PANEL
// ==========================================
const JogPanel = () => {
    const { modals, toasts } = useUiContext()
    const { createNewRequest } = useHttpFn
    // ProcessData entegrasyonu (Canlı Z güncellemesi için)
    const { flowRate, feedRate, positions, processData } = useTargetContext()
    const [customCommands, setCustomCommands] = useState([])
    const [stepSize, setStepSize] = useState(10);
    const id = "jogPanel"

    useEffect(() => {
        const savedCommands = localStorage.getItem("esp3d_custom_commands")
        if (savedCommands) setCustomCommands(JSON.parse(savedCommands))
    }, [])

    useEffect(() => {
        localStorage.setItem("esp3d_custom_commands", JSON.stringify(customCommands))
    }, [customCommands])

    const SendCommand = (commandString) => {
        const commands = commandString.split('\n').filter(c => c.trim() !== '');
        commands.forEach(cmd => {
             createNewRequest(
                espHttpURL("command", { cmd: cmd }),
                { method: "GET", echo: cmd },
                { 
                    onSuccess: (result) => {
                        if(processData) processData("response", result);
                    }, 
                    onFail: (err) => toasts.addToast({ content: err, type: "error" }) 
                }
            )
        })
    };

    const moveZ = (dir) => {
        useUiContextFn.haptic();
        // M114 ile anlık pozisyon raporu
        const cmd = `G91\nG1 Z${dir * stepSize} F300\nG90\nM114`;
        SendCommand(cmd);
    };

    // --- Modal Logic ---
    const handleSaveCommand = (label, command, id = null) => {
        if (!label || !command) return;
        if (id) { setCustomCommands(prev => prev.map(c => c.id === id ? { ...c, label, command } : c)); } 
        else { setCustomCommands(prev => [...prev, { id: Date.now(), label, command }]); }
    };
    const handleDeleteCommand = (id) => { setCustomCommands(prev => prev.filter(c => c.id !== id)); };
    const openCommandModal = (cmdToEdit = null) => {
        let label = cmdToEdit ? cmdToEdit.label : "";
        let command = cmdToEdit ? cmdToEdit.command : "";
        showModal({
            modals, title: cmdToEdit ? "Edit Command" : "New Command",
            button1: { text: "Save", cb: () => handleSaveCommand(label, command, cmdToEdit ? cmdToEdit.id : null) },
            button2: { text: "Cancel" },
            content: ( <Fragment> <div class="form-group"><label>Label</label><input class="form-input" type="text" value={label} onInput={e => (label = e.target.value)} /></div> <div class="form-group"><label>G-Code</label><textarea class="form-input" rows="4" value={command} onInput={e => (command = e.target.value)}></textarea></div> </Fragment> ),
        });
    };

    return (
        <div class="panel panel-dashboard" id={id} >
            <style>{styles}</style>
            <ContainerHelper id={id} />
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Move />
                    <strong class="text-ellipsis">TUNE & MOVE</strong>
                </span>
                <span class="navbar-section">
                    <span class="H-100"><FullScreenButton elementId={id} /><CloseButton elementId={id} hideOnFullScreen={true} /></span>
                </span>
            </div>

            <div class="panel-body" style={{ padding: '20px' }}>
                <div className="panel-container-width">
                    
                    {/* 1. FLOW RATE */}
                    <ErgoInputControl 
                        element={{ name: "P92", list: flowRate }} 
                        index={0} pos={1} label="FLOW RATE"
                        icon={<Wind size="14" />} 
                    />
                    
                    {/* 2. PRINT SPEED */}
                    <ErgoInputControl 
                        element={{ name: "P93", list: feedRate }} 
                        index={0} pos={2} label="PRINT SPEED"
                        icon={<Activity size="14" />} 
                    />
                    
                    {/* 3. HOME & MOTORS OFF */}
                    <div className="action-grid">
                        <div className="big-btn btn-home" onClick={() => SendCommand(useUiContextFn.getValue("homecmd").replace("$", ""))}>
                            <Home size="28" strokeWidth={1.5} />
                            <span className="btn-label">HOME ALL</span>
                        </div>
                        <div className="big-btn btn-off" onClick={() => SendCommand(useUiContextFn.getValue("motoroff").replace(/;/g, "\n"))}>
                            <ZapOff size="28" strokeWidth={1.5} />
                            <span className="btn-label">MOTORS OFF</span>
                        </div>
                    </div>

                    {/* 4. Z-AXIS CONTROL */}
                    <div className="control-card">
                        <div className="card-header" style={{ justifyContent: 'space-between' }}>
                            <span style={{ display:'flex', alignItems:'center', gap:'8px' }}><Move size="14"/> Z-AXIS MOVE</span>
                            <span style={{ color: '#3b82f6', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                                Z: {positions.z}
                            </span>
                        </div>

                        <div className="z-axis-layout">
                            {/* Step Seçimi */}
                            <div className="stepper-presets">
                                {[0.1, 1, 5, 10].map(val => (
                                    <div key={val} className={`preset-btn ${stepSize === val ? 'active' : ''}`} onClick={() => { useUiContextFn.haptic(); setStepSize(val); }}>
                                        {val}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Yukarı / Aşağı */}
                            <div className="z-actions-row">
                                <div className="z-jog-btn" onClick={() => moveZ(1)}>
                                    <ChevronUp size="32" />
                                </div>
                                <div className="z-jog-btn" onClick={() => moveZ(-1)}>
                                    <ChevronDown size="32" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. CUSTOM COMMANDS */}
                    <div className="control-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h6 className="card-header" style={{ margin: 0 }}>
                                <Command size="14"/> CUSTOM COMMANDS
                            </h6>
                            <div style={{ color: '#3b82f6', cursor: 'pointer', padding:'4px' }} onClick={() => openCommandModal()}>
                                <Plus size="18" />
                            </div>
                        </div>
                        
                        <div className="cmd-list">
                            {customCommands.length === 0 && <span style={{fontSize:'0.8rem', color:'#cbd5e1'}}>No commands.</span>}
                            {customCommands.map(cmd => (
                                <div key={cmd.id} className="cmd-tag">
                                    <span onClick={() => { useUiContextFn.haptic(); SendCommand(cmd.command); }}>{cmd.label}</span>
                                    <Edit3 size="12" style={{marginLeft:'4px', opacity:0.5}} onClick={(e) => { e.stopPropagation(); openCommandModal(cmd); }} />
                                    <Trash2 size="12" color="#ef4444" style={{marginLeft:'2px', opacity:0.5}} onClick={(e) => { e.stopPropagation(); handleDeleteCommand(cmd.id); }} />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

const JogPanelElement = {
    id: "jogPanel",
    content: <JogPanel />,
    name: "S66",
    icon: "Move",
    show: "showjogpanel",
    onstart: "openjogonstart",
    settingid: "jog",
}

export { JogPanel, JogPanelElement }