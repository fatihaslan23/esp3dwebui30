/*
 Terminal.js - ESP3D WebUI component file
 Modified by DevMentor (2025) - AutoScroll Fix
*/

import { h } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"
import { T } from "../Translations"
import {
    Terminal,
    Send,
    CheckCircle,
    Circle,
    PauseCircle,
    ChevronLeft,
    ChevronRight,
} from "preact-feather"
import { useUiContext, useDatasContext, useUiContextFn } from "../../contexts"
import { useTargetContext, variablesList } from "../../targets"
import { useHttpQueue } from "../../hooks"
import { espHttpURL, replaceVariables } from "../Helpers"
import { ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { Menu as PanelMenu } from "./"

const TerminalPanel = () => {
    const { panels, uisettings, toasts } = useUiContext() 
    const { terminal } = useDatasContext()
    const { processData } = useTargetContext()
    const { createNewRequest } = useHttpQueue()

    // --- State Tanımları ---
    const [pendingPrint, setPendingPrint] = useState(null);
    const [isCapturingFileList, setIsCapturingFileList] = useState(false);
    const [fileListRaw, setFileListRaw] = useState("");

    if (!terminal.setPendingPrint) {
        terminal.setPendingPrint = setPendingPrint;
    }

    if (terminal.isVerbose.current == undefined)
        terminal.isVerbose.current = uisettings.getValue("verbose")
    if (terminal.isAutoScroll.current == undefined)
        terminal.isAutoScroll.current = uisettings.getValue("autoscroll")
    
    const [isVerbose, setIsVerbose] = useState(terminal.isVerbose.current)
    const [isAutoScroll, setIsAutoScroll] = useState(terminal.isAutoScroll.current)
    const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false)
    
    // useRef Tanımları
    const lastPos = useRef(0)
    const inputRef = useRef()
    const messagesEndRef = useRef(null)
    const terminalOutput = useRef(null)
    const id = "terminalPanel"
    const inputHistoryIndex = useRef(terminal.inputHistory.length)

    // --- Scroll Fonksiyonu ---
    const scrollToBottom = () => {
        if (
            terminal.isAutoScroll.current &&
            !terminal.isAutoScrollPaused.current
        ) {
            // DOM render işleminin bitmesini garanti etmek için requestAnimationFrame kullanıyoruz
            requestAnimationFrame(() => {
                if (terminalOutput.current) {
                    terminalOutput.current.scrollTop = terminalOutput.current.scrollHeight;
                }
            });
        }
    }

    // --- Geçmiş (History) Yönetimi ---
    const historyPrev = () => {
        if (terminal.inputHistory.length > 0 && inputHistoryIndex.current > 0) {
            inputHistoryIndex.current--
            inputRef.current.value = terminal.inputHistory[inputHistoryIndex.current]
            terminal.input.current = inputRef.current.value
        }
    }

    const historyNext = () => {
        if (
            terminal.inputHistory.length > 0 &&
            inputHistoryIndex.current < terminal.inputHistory.length-1
        ) {
            inputHistoryIndex.current++
            inputRef.current.value = terminal.inputHistory[inputHistoryIndex.current]
            terminal.input.current = inputRef.current.value
        } else {
            inputRef.current.value = ""
            terminal.input.current = inputRef.current.value
            inputHistoryIndex.current = terminal.inputHistory.length
        }
    }

    const onKeyUp = (e) => {
        switch (e.keyCode) {
            case 13: onSend(e); break;
            case 38: historyPrev(); break;
            case 40: historyNext(); break;
            default: break; //ignore
        }
    }

    const onSend = (e) => {
        useUiContextFn.haptic()
        inputRef.current.focus()
        if (!terminal.input.current && variablesList.allowEmptyLine)
            terminal.input.current = ""
        if (
            (terminal.input.current && terminal.input.current.trim().length > 0) ||
            variablesList.allowEmptyLine
        ) {
            const cmd = terminal.input.current.trim().toUpperCase()
            if (
                cmd.length > 0 &&
                terminal.inputHistory[terminal.inputHistory.length - 1] != cmd
            ) {
                terminal.addInputHistory(cmd)
            }
            inputHistoryIndex.current = terminal.inputHistory.length
            processData("echo", replaceVariables(variablesList.commands, cmd, true))
            createNewRequest(
                espHttpURL("command", { cmd: replaceVariables(variablesList.commands, cmd) }),
                { method: "GET" },
                {
                    onSuccess: (result) => { processData("response", result) },
                    onFail: (error) => {
                        console.log(error)
                        processData("error", error)
                    },
                }
            )
        }
        inputHistoryIndex.current = terminal.inputHistory.length
        terminal.input.current = ""
        inputRef.current.value = ""
    }

    const onInput = (e) => {
        terminal.input.current = e.target.value
    }

    // ==========================================================
    // DÜZELTME 1: SCROLL TRIGGER (ARTIK BAĞIMSIZ VE EN DIŞTA)
    // ==========================================================
    useEffect(() => {
        // İçerik (terminal.content) her değiştiğinde bu çalışır.
        // pendingPrint'ten bağımsızdır.
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 50); // DOM update için ufak bir gecikme
        return () => clearTimeout(timer);
    }, [terminal.content, terminal.content.length, isVerbose, isAutoScroll]);


    // ==========================================================
    // DÜZELTME 2: PRINT DOSYA YAKALAMA MANTIĞI (BAĞIMSIZ)
    // ==========================================================
    useEffect(() => {
        // Eğer bekleyen bir baskı işi yoksa burası çalışmasın
        if (!pendingPrint) return;

        const parseAndPrint = (rawList) => {
            console.log("Ayrıştırılacak Ham Liste:", rawList);
            const lines = rawList.split(/[\r\n]+/).filter(line => line.trim() !== "");
            const fileMap = new Map();
            const regex = /^([\w~\.\/\\-]+)\s+\d+\s+(.*)$/i;
        
            lines.forEach(line => {
                const match = line.trim().match(regex);
                if (match) {
                    const shortNameWithPath = match[1];
                    let longNameFromFile = match[2].trim();
                    if (longNameFromFile.startsWith("/")) { longNameFromFile = longNameFromFile.substring(1); }
        
                    let fullLongPath;
                    if (longNameFromFile.includes('/')) {
                        fullLongPath = longNameFromFile;
                    } else {
                        const lastSlashIndex = shortNameWithPath.lastIndexOf('/');
                        let dirPath = '';
                        if (lastSlashIndex > -1) {
                            dirPath = shortNameWithPath.substring(0, lastSlashIndex + 1);
                        }
                        fullLongPath = dirPath + longNameFromFile;
                    }
        
                    const normalizedKey = fullLongPath.toLowerCase().replace(/\.(gcode|gco)$/i, '');
                    fileMap.set(normalizedKey, shortNameWithPath);
                }
            });
        
            console.log("Oluşturulan Harita (Map):", fileMap);
            const targetLongNameLower = pendingPrint.fullPath.toLowerCase().replace(/\.(gcode|gco)$/i, '');
            console.log(`Haritada Aranan Saf İsim: '${targetLongNameLower}'`);
            
            const shortPathToPrint = fileMap.get(targetLongNameLower);
        
            if (shortPathToPrint) {
                toasts.addToast({ content: `Kısa ad bulundu: ${shortPathToPrint}. Baskı başlatılıyor...`, type: "success" });
                const selectFileCmd = `M23 ${shortPathToPrint}`;
                const startPrintCmd = 'M24';
                processData("echo", `> ${selectFileCmd}`);
                createNewRequest(
                    espHttpURL("command", { cmd: selectFileCmd }),
                    { method: "GET" },
                    {
                        onSuccess: (result) => {
                            processData("response", result);
                            processData("echo", `> ${startPrintCmd}`);
                            createNewRequest(
                                espHttpURL("command", { cmd: startPrintCmd }),
                                { method: "GET" },
                                { onSuccess: (res) => processData("response", res), onFail: (err) => processData("error", err) }
                            );
                        },
                        onFail: (error) => { processData("error", error); }
                    }
                );
            } else {
                toasts.addToast({ content: `HATA: '${pendingPrint.longName}' için kısa ad bulunamadı!`, type: "error" });
            }
            
            setPendingPrint(null);
            setFileListRaw("");
            setIsCapturingFileList(false);
        };
    
        const originalFullText = terminal.content.map(line => line.content).join('\n');
        const lowerCaseFullText = originalFullText.toLowerCase();
        const beginMarker = 'begin file list';
        const endMarker = 'end file list';
    
        const lastBeginIndex = lowerCaseFullText.lastIndexOf(beginMarker);
        if (lastBeginIndex > -1) {
            const lastEndIndex = lowerCaseFullText.indexOf(endMarker, lastBeginIndex);
            if (lastEndIndex > -1) {
                const startIndex = lastBeginIndex + beginMarker.length;
                const fileList = originalFullText.substring(startIndex, lastEndIndex);
                // Sadece pendingPrint varsa çalıştır
                parseAndPrint(fileList);
            }
        }
    }, [terminal.content, pendingPrint]); // Sadece ilgili şeyler değişince çalışır


    // Cleanup Effect
    useEffect(() => {
        return () => {
            inputHistoryIndex.current = terminal.inputHistory.length - 1;
        };
    }, []);

    const toggleVerboseMode = () => {
        useUiContextFn.haptic()
        terminal.isVerbose.current = !isVerbose
        setIsVerbose(!isVerbose)
    }

    const toggleAutoScroll = () => {
        useUiContextFn.haptic()
        if (!isAutoScrollPaused) {
            terminal.isAutoScroll.current = !isAutoScroll
            setIsAutoScroll(!isAutoScroll)
        }
        terminal.isAutoScrollPaused.current = false
        setIsAutoScrollPaused(false)
        scrollToBottom()
    }

    const menu = [
        {
            label: T("S76"),
            displayToggle: () => (
                <span class="feather-icon-container">
                    {isVerbose ? <CheckCircle size="0.8rem" /> : <Circle size="0.8rem" />}
                </span>
            ),
            onClick: toggleVerboseMode,
        },
        {
            label: T("S77"),
            displayToggle: () => (
                <span class="feather-icon-container">
                    {isAutoScroll ? (
                        isAutoScrollPaused ? <PauseCircle size="0.8rem" /> : <CheckCircle size="0.8rem" />
                    ) : (
                        <Circle size="0.8rem" />
                    )}
                </span>
            ),
            onClick: toggleAutoScroll,
        },
        { divider: true },
        {
            label: T("S79"),
            onClick: (e) => {
                useUiContextFn.haptic()
                terminal.clear()
            },
            icon: <span class="btn btn-clear" aria-label="Close" />,
        },
    ]

    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id}/>
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Terminal />
                    <strong class="text-ellipsis">{T("Terminal")}</strong>
                </span>
                <span class="navbar-section">
                    <span class="full-height">
                        <PanelMenu items={menu} />
                        <FullScreenButton elementId={id} />
                        <CloseButton elementId={id} hideOnFullScreen={true} />
                    </span>
                </span>
            </div>
            <div class="input-group m-2">
                <input
                    type="text"
                    class="form-input"
                    onInput={onInput}
                    onkeyup={onKeyUp}
                    ref={inputRef}
                    value={terminal.input.current}
                    placeholder={T("S80")}
                />
                <ButtonImg
                    group
                    ltooltip
                    data-tooltip={T("S82")}
                    label={T("S81")}
                    icon={<Send />}
                    onClick={onSend}
                />
            </div>
            <div class="show-low">
                <ButtonImg class=" m-2" icon={<ChevronLeft />} onClick={historyPrev} />
                <ButtonImg class=" m-2" icon={<ChevronRight />} onClick={historyNext} />
            </div>
            <div
                ref={terminalOutput}
                class="panel-body panel-body-dashboard terminal m-1"
                onScroll={(e) => {
                    // Kullanıcı yukarı mı kaydırıyor kontrolü
                    if (
                        lastPos.current > e.target.scrollTop &&
                        terminal.isAutoScroll.current
                    ) {
                        terminal.isAutoScrollPaused.current = true
                        setIsAutoScrollPaused(true)
                    }
                    
                    // Kullanıcı tekrar en aşağıya indi mi kontrolü
                    if (
                        terminal.isAutoScrollPaused.current &&
                        Math.abs(e.target.scrollTop + e.target.offsetHeight - e.target.scrollHeight) < 5
                    ) {
                        terminal.isAutoScrollPaused.current = false
                        setIsAutoScrollPaused(false)
                    }
                    // Son pozisyonu güncelle
                    lastPos.current = e.target.scrollTop
                }}
            >
                {terminal.content &&
                    terminal.content.map((line) => {
                        let className = ""
                        switch (line.type) {
                            case "echo": className = "echo"; break;
                            case "error": className = "error"; break;
                            default: break;
                        }
                        if (line.isAction) {
                            return (
                                <pre class="action" title={line.actionType}>
                                    {line.content}
                                </pre>
                            )
                        } else if (isVerbose || isVerbose === line.isverboseOnly) {
                            return <pre class={className}>{line.content}</pre>
                        }
                    })}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}

const TerminalPanelElement = {
    id: "terminalPanel",
    content: <TerminalPanel />,
    name: "S75",
    icon: "Terminal",
    show: "showterminalpanel",
    onstart: "openterminalonstart",
    settingid: "terminal",
}

export { TerminalPanel, TerminalPanelElement }