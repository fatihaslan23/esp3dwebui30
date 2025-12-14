/*
Files.js - ESP3D WebUI component file
Modified by DevMentor (2025) - FINAL FIX: Mobile List Height & Desktop Buttons
*/

import { Fragment, h } from "preact"
import { useEffect, useState, useRef } from "preact/hooks"
import { T } from "../Translations"
import { useHttpFn } from "../../hooks"
import { espHttpURL, getBrowserTime } from "../Helpers"
import {
    Loading,
    ButtonImg,
    CenterLeft,
    Button,
    Progress,
    FullScreenButton,
    CloseButton,
    ContainerHelper,
} from "../Controls"
import { useUiContext, useUiContextFn, useDatasContext } from "../../contexts"
import { showModal, showConfirmationModal, showProgressModal } from "../Modal"
import {
    HardDrive,
    Upload,
    RefreshCcw,
    FolderPlus,
    CornerRightUp,
    Edit3,
    XCircle,
    Play,
    Trash2,
    File,
    Folder,
    StopCircle
} from "preact-feather"
import { files, processor, useTargetContextFn } from "../../targets"
import { Menu as PanelMenu } from "./"

let currentFS = ""
const currentPath = {}
const filesListCache = {}
let currentFSNeedInit = true

// ==========================================
// 1. MODERN CSS STYLES (KESİN ÇÖZÜM)
// ==========================================
const styles = `
    /* --- 1. GLOBAL PANEL RESET --- */
    #filesPanel.panel {
        display: flex !important;
        flex-direction: column !important;
        background-color: #f2f2f7 !important; 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        
        /* MASAÜSTÜ VARSAYILAN */
        height: 100% !important; 
        overflow: hidden !important; 
        padding: 0 !important;
    }

    #filesPanel .navbar { flex-shrink: 0; }
    .smooth-transition { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    
    /* --- TOOLBAR --- */
    .toolbar-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px;
        background-color: #fff;
        border-bottom: 1px solid #e5e5ea;
        flex-shrink: 0; 
        z-index: 20;
    }

    .toolbar-row { display: flex; align-items: center; width: 100%; gap: 8px; }

    /* --- DOSYA LISTESI (DEFAULT/DESKTOP) --- */
    .drop-zone { 
        flex: 1 1 auto !important;    
        min-height: 0 !important;     
        overflow-y: auto !important;  
        height: 0 !important; /* Desktop için trick */
        padding: 10px;
        border: 2px dashed transparent;
        display: block; 
        -webkit-overflow-scrolling: touch;
    }
    .drop-zone--over { border-color: #007aff; background-color: #eef7ff; border-radius: 12px; }

    /* --- KARTLAR --- */
    .file-card {
        background-color: #fff; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px;
        display: flex; align-items: center; justify-content: space-between;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04); border: 1px solid transparent; transition: transform 0.1s;
    }
    .file-card:active { background-color: #f2f2f7; }
    .file-card:hover { background-color: #dceefdff; }
    .file-info { display: flex; align-items: center; gap: 12px; flex-grow: 1; overflow: hidden; }
    .file-icon-wrapper { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background-color: #f2f2f7; color: #8e8e93; }
    .file-icon-wrapper.folder { color: #ffcc00; background-color: #fff9e6; }
    .file-icon-wrapper.file { color: #007aff; background-color: #eef7ff; }
    .file-name { font-weight: 600; color: #1c1c1e; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
    .file-meta { font-size: 0.75rem; color: #8e8e93; margin-top: 2px; }
    .file-actions { display: flex; align-items: center; gap: 8px; }
    .action-icon-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #8e8e93; cursor: pointer; }
    .action-icon-btn.play:hover { background-color: #eef7ff; color: #007aff; }
    .action-icon-btn.delete:hover { background-color: #fff2f2; color: #ff3b30; }

    /* --- FOOTER --- */
    .files-list-footer {
        background-color: #fff; border-top: 1px solid #e5e5ea; flex-shrink: 0; padding: 8px 15px; z-index: 10;
        font-size: 0.75rem; color: #8e8e93; margin-top: auto;
    }
    
    /* --- SELECT --- */
    .modern-select {
        appearance: none; -webkit-appearance: none; border: 1px solid #e5e5ea; border-radius: 8px;
        padding: 0 30px 0 12px; font-weight: 600; color: #1c1c1e; background-color: #fff;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007AFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat; background-position: right 10px top 50%; background-size: 10px auto;
        outline: none; font-size: 0.9rem; height: 38px; flex-grow: 1; min-width: 120px;
    }

    /* --- BUTON STİLLERİ --- */
    .toolbar-btn {
        background-color: #f2f2f7; color: #007aff; border: none; border-radius: 10px;
        height: 38px; padding: 0 16px; display: flex; align-items: center; justify-content: center; gap: 6px;
        font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
    }
    .toolbar-btn:hover { background-color: #e5e5ea; transform: translateY(-1px); }
    .toolbar-btn:active { background-color: #d1d1d6; transform: scale(0.98); }
    .toolbar-btn.primary { background-color: #007aff; color: #fff; }
    .toolbar-btn.primary:hover { background-color: #0062cc; }

    .stop-btn-glow {
        background-color: #ff3b30; color: white; border: none; border-radius: 10px;
        padding: 0 20px; height: 38px; font-weight: 700; font-size: 0.85rem;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        cursor: pointer; box-shadow: 0 2px 5px rgba(255, 59, 48, 0.2); transition: all 0.2s ease;
        white-space: nowrap;
    }
    .stop-btn-glow:hover { background-color: #d70015; transform: translateY(-1px); }
    .stop-btn-glow:active { transform: scale(0.98); opacity: 0.9; }


    /* =========================================================
       MASAÜSTÜ GÖRÜNÜMÜ (PC)
       ========================================================= */
    @media (min-width: 769px) {
        .toolbar-btn { width: auto; flex-grow: 0; }
        .toolbar-btn.icon-only { width: 38px; padding: 0; }
        .stop-btn-glow { width: auto; flex-grow: 0; }
        .toolbar-action-row { justify-content: flex-start; }
        .stop-container { margin-left: auto; }
        
        /* Masaüstünde liste yüksekliği */
        .drop-zone { height: 0 !important; } 
    }

    /* =========================================================
       MOBİL GÖRÜNÜMÜ (TELEFON) - KESİN DÜZELTME
       ========================================================= */
    @media (max-width: 768px) {
        /* 1. Panelin kendisi esnek olsun ama taşmasın */
        #filesPanel.panel {
            height: auto !important; /* İçeriğe göre uzasın */
            max-height: 85vh !important; /* Ekranın %85'ini geçmesin */
            min-height: 0 !important;
        }

        /* 2. Dosya Listesi Yüksekliği (ÇÖZÜM BURADA) */
        .drop-zone {
            /* Bu listeye ZORUNLU bir yükseklik veriyoruz ki ezilmesin */
            height: auto !important;
            min-height: 300px !important; /* EN AZ 300px YER KAPLA */
            flex: 1 1 auto !important;
        }

        /* 3. Toolbar Düzeni */
        .toolbar-row.actions { flex-direction: column-reverse; gap: 8px; }
        .toolbar-row.actions > div:first-child { width: 100%; display: flex; gap: 8px; }
        .toolbar-btn { flex-grow: 1; width: 100%; height: 44px; font-size: 0.9rem; }
        .toolbar-btn.icon-only { flex-grow: 0 !important; width: 44px; }
        .stop-container { width: 100%; margin-top: 5px; }
        .stop-btn-glow { width: 100%; height: 48px; font-size: 1rem; }

        /* 4. Liste Elemanları */
        .file-card { padding: 14px; }
        .file-name { font-size: 1rem; }
        .action-icon-btn { width: 44px; height: 44px; background-color: #f2f2f7; border-radius: 50%; }
        
        .files-list-footer { padding-bottom: 20px; }
    }
`;

const FilesPanel = () => {

    const valids = files.supported.reduce((acc, element) => {
        if (element.depend) if (element.depend()) acc.push(element.value)
        return acc
    },[])
    if (currentFS == "") {
        currentFS = useUiContextFn.getValue("default_filesystem")
        if (typeof currentFS === "undefined" || !valids.includes(currentFS)) currentFS = ""
    }
    const id = "filesPanel"
    const [filePath, setFilePath] = useState(currentPath[currentFS])
    const [isLoading, setIsLoading] = useState(false)
    const [fileSystem, setFileSystem] = useState(currentFS)
    const [filesList, setFilesList] = useState(filesListCache[currentFS])
    const [menu, setMenu] = useState(null)
    const { createNewRequest, abortRequest } = useHttpFn
    const { processData } = useTargetContextFn
    const { modals, toasts } = useUiContext()
    const { terminal } = useDatasContext()
    const fileref = useRef()
    const dropRef = useRef()
    const progressBar = {}
    
    const onCancel = () => {
        useUiContextFn.haptic()
        processor.stopCatchResponse()
        setIsLoading(false)
        toasts.addToast({ content: T("S175"), type: "error" })
        filesListCache[currentFS] = { files: [], status: "S22" }
        setFilesList(filesListCache[currentFS])
    }

    const sendSerialCmd = (command) => {
        const cmds = command.split(";")
        cmds.forEach((cmd) => {
            createNewRequest(
                espHttpURL("command", { cmd: cmd }),
                { method: "GET", echo: cmd },
                { onSuccess: () => {}, onFail: (error) => { console.log(error); processor.stopCatchResponse(); setIsLoading(false); toasts.addToast({ content: error, type: "error" }) } }
            )
        })
    }

    const sendURLCmd = (cmd) => {
        createNewRequest(
            espHttpURL(cmd.url, cmd.args),
            { method: "GET" },
            {
                onSuccess: (result) => {
                    filesListCache[currentFS] = files.command(currentFS, "formatResult", result)
                    setFilesList(filesListCache[currentFS])
                    setIsLoading(false)
                },
                onFail: (error) => {
                    console.log(error)
                    setIsLoading(false)
                    toasts.addToast({ content: error, type: "error" })
                },
            }
        )
    }

    const processFeedback = (feedback) => {
        if (feedback.status) {
            if (feedback.command == "list") {
                if (feedback.status == "error") {
                    toasts.addToast({ content: T("S4"), type: "error" })
                    filesListCache[currentFS] = { files: [], status: "S22" }
                    setFilesList(filesListCache[currentFS])
                } else {
                    filesListCache[currentFS] = files.command(currentFS, "formatResult", feedback)
                    if (files.capability(currentFS, "IsFlatFS")) {
                        setFilesList(files.command(currentFS, "filterResult", filesListCache[currentFS], currentPath[currentFS]))
                    } else {
                        setFilesList(filesListCache[currentFS])
                    }
                }
            } else {
                if (feedback.command == "delete" || feedback.command == "createdir") {
                    if (feedback.status == "error") {
                        toasts.addToast({
                            content: feedback.command == "delete" ? T("S85").replace("%s", feedback.arg) : T("S84").replace("%s", feedback.arg),
                            type: "error",
                        })
                    } else {
                        onRefresh(null, false)
                        return
                    }
                }
            }
            setIsLoading(false)
        }
        setIsLoading(false)
    }

    const handleStopPrint = () => {
        useUiContextFn.haptic();
        showConfirmationModal({
            modals,
            title: "Stop Current Print",
            content: "Are you sure you want to stop the print? This action cannot be undone.",
            button1: {
                cb: () => {
                    const stopCmds = ["M108", "M108", "M108", "M524", "M524", "M524", "M27", "M108", "M108", "M108", "M524", "M524", "M524", "M27", "M108", "M108", "M108", "M524", "M524", "M524", "M27"];
                    stopCmds.forEach(cmd => sendSerialCmd(cmd));
                    toasts.addToast({ content: "Stop command (M524) sent!", type: "warning" });
                },
                text: "Stop Print",
                className: "btn-error"
            },
            button2: { text: "Cancel" }
        });
    };

    const uploadFiles = () => {
        setIsLoading(true)
        const cmd = files.command(currentFS, "upload", currentPath[currentFS])
        const list = fileref.current.files
        if (list.length > 0) {
            showProgressModal({
                modals,
                title: T("S32"),
                button1: { cb: abortRequest, text: T("S28") },
                content: <Progress progressBar={progressBar} max="100" />,
            })
            const formData = new FormData()
            formData.append("path", currentPath[currentFS])
            for (let i = 0; i < list.length; i++) {
                const file = list[i]
                let fileName = ""
                const needFormatFileName = files.command(currentFS, "needFormatFileName", cmd.args.path, fileref.current.files[i].name)
                if (needFormatFileName.type != "error" && needFormatFileName.name) {
                    fileName = needFormatFileName.name
                } else {
                    fileName = file.name
                }
                const arg = cmd.args.path + (cmd.args.path.endsWith("/") ? "" : "/") + fileName + "S"
                formData.append(arg, file.size)
                const time_string = getBrowserTime(file.lastModified)
                const argt = arg.substring(0, arg.length - 1) + "T"
                formData.append(argt, time_string)
                formData.append("myfiles", file, cmd.args.path + (cmd.args.path.endsWith("/") ? "" : "/") + fileName)
            }
            createNewRequest(
                espHttpURL(cmd.url),
                { method: "POST", id: "upload", body: formData },
                {
                    onSuccess: (result) => {
                        modals.removeModal(modals.getModalIndex("upload"))
                        const cmdpost = files.command(currentFS, "postUpload", currentPath[currentFS], fileref.current.files[0].name)
                        if (cmdpost.type == "error" || cmdpost.type == "none") {
                            filesListCache[currentFS] = files.command(currentFS, "formatResult", result)
                            setFilesList(filesListCache[currentFS])
                            setIsLoading(false)
                        } else {
                            if (cmdpost.type == "refresh") {
                                setTimeout(() => { onRefresh(null, cmdpost.arg) }, cmdpost.timeOut)
                            }
                        }
                    },
                    onFail: (error) => {
                        modals.removeModal(modals.getModalIndex("upload"))
                        toasts.addToast({ content: error, type: "error" })
                        setIsLoading(false)
                    },
                    onProgress: (e) => {
                        if (progressBar.update && typeof progressBar.update === "function") progressBar.update(e)
                    },
                }
            )
        }
    }

    const filesSelected = (e) => {
        const content = []
        const length = fileref.current.files.length
        for (let index = 0; index < length; index++) {
            content.push(<li>{fileref.current.files[index].name}</li>)
            if (!files.capability(currentFS, "Upload", currentPath[currentFS], fileref.current.files[index].name)) {
                const eMsg = files.capability(currentFS, "Upload", currentPath[currentFS], fileref.current.files[index].name, true)
                toasts.add({ content: T(eMsg), type: "error" })
            }
        }
        showConfirmationModal({
            modals,
            title: T("S31"),
            content: <CenterLeft>{content}</CenterLeft>,
            button1: { cb: uploadFiles, text: T("S27") },
            button2: { text: T("S28") },
        })
    }

    const downloadFile = (element) => {
        const cmd = files.command(currentFS, "download", currentPath[currentFS], element.name)
        showProgressModal({
            modals,
            title: T("S108"),
            button1: { cb: abortRequest, text: T("S28") },
            content: <Progress progressBar={progressBar} max="100" />,
        })
        createNewRequest(
            espHttpURL(cmd.url, cmd.args),
            { method: "GET", id: "download" },
            {
                onSuccess: (result) => {
                    if (progressBar.update && typeof progressBar.update === "function") progressBar.update(100)
                    setTimeout(() => { modals.removeModal(modals.getModalIndex("progression")) }, 2000)
                    const file = new Blob([result], { type: "application/octet-stream" })
                    if (window.navigator.msSaveOrOpenBlob) window.navigator.msSaveOrOpenBlob(file, element.name)
                    else {
                        let a = document.createElement("a"), url = URL.createObjectURL(file)
                        a.href = url
                        a.download = element.name
                        document.body.appendChild(a)
                        a.click()
                        setTimeout(function () { document.body.removeChild(a); window.URL.revokeObjectURL(url) }, 0)
                    }
                },
                onFail: (error) => {
                    modals.removeModal(modals.getModalIndex("progression"))
                    toasts.addToast({ content: error, type: "error" })
                },
                onProgress: (e) => {
                    if (progressBar.update && typeof progressBar.update === "function") progressBar.update(e)
                },
            }
        )
    }

    const createDirectory = (name) => {
        const cmd = files.command(currentFS, "createdir", currentPath[currentFS], name)
        if (cmd.type == "url") {
            sendURLCmd(cmd)
        } else if (cmd.type == "cmd") {
            if (processor.startCatchResponse(currentFS, "createdir", processFeedback, name)) {
                setIsLoading(true)
                sendSerialCmd(cmd.cmd)
            }
        }
    }

    const deleteCommand = (element) => {
        const cmd = files.command(currentFS, element.size == -1 ? "deletedir" : "delete", currentPath[currentFS], element.name)
        if (cmd.type == "url") {
            sendURLCmd(cmd)
        } else if (cmd.type == "cmd") {
            if (processor.startCatchResponse(currentFS, "delete", processFeedback, element.name)) {
                setIsLoading(true)
                sendSerialCmd(cmd.cmd)
            }
        }
    }

    const setupFileInput = () => {
        if (currentFS == "") return
        fileref.current.multiple = files.capability(currentFS, "UploadMultiple")
        if (files.capability(currentFS, "UseFilters")) {
            let f = useUiContextFn.getValue("filesfilter").trim()
            f = (f.length > 0 && f != "*") ? "." + f.replace(/;/g, ",.") : "*"
            fileref.current.accept = f
        } else {
            fileref.current.accept = "*"
        }
    }

    const onSelectFS = (e, norefresh = false) => {
        if (e) currentFS = e.target.value
        setupFileInput()
        setFileSystem(currentFS)
        if (!currentPath[currentFS]) currentPath[currentFS] = "/"
        if (!norefresh) onRefresh(e, true)
    }

    const ElementClicked = (e, line) => {
        if (line.size == -1) {
            currentPath[currentFS] = currentPath[currentFS] + (currentPath[currentFS] == "/" ? "" : "/") + line.name
            onRefresh(e, files.capability(currentFS, "IsFlatFS"))
        } else {
            if (files.capability(currentFS, "Download")) {
                const content = <li>{line.name}</li>
                showConfirmationModal({
                    modals,
                    title: T("S87"),
                    content,
                    button1: { cb: () => { downloadFile(line) }, text: T("S27") },
                    button2: { text: T("S28") },
                })
            }
        }
    }

    const onRefresh = (e, usecache = false) => {
        if (e) useUiContextFn.haptic()
        setIsLoading(true)
        setFilePath(currentPath[currentFS])
        if (usecache && filesListCache[currentFS]) {
            if (files.capability(currentFS, "IsFlatFS")) {
                setFilesList(
                    files.command(
                        currentFS,
                        "filterResult",
                        filesListCache[currentFS],
                        currentPath[currentFS]
                    )
                )
            } else {
                setFilesList(filesListCache[currentFS])
            }
            setIsLoading(false)
        } else {
            const cmd = files.command(currentFS, "list", currentPath[currentFS])
            if (cmd.type == "url") {
                createNewRequest(
                    espHttpURL(cmd.url, cmd.args),
                    { method: "GET" },
                    {
                        onSuccess: (result) => {
                            filesListCache[currentFS] = files.command(
                                currentFS,
                                "formatResult",
                                result
                            )
                            setFilesList(filesListCache[currentFS])
                            setIsLoading(false)
                        },
                        onFail: (error) => {
                            console.log(error)
                            setIsLoading(false)
                            toasts.addToast({ content: error, type: "error" })
                        },
                    }
                )
            } else if (cmd.type == "cmd") {
                if (
                    processor.startCatchResponse(
                        currentFS,
                        "list",
                        processFeedback
                    )
                )
                    sendSerialCmd(cmd.cmd)
            }
        }
    }

    useEffect(() => {
        if (currentFS == "") {
            const fs = files.supported.find((element) => {
                if (element.depend) if (element.depend()) return true
                return false
            })
            if (fs) {
                currentFS = fs.value
                onSelectFS(null, !useUiContextFn.getValue("autoload"))
                currentFSNeedInit = false
            }
        } else {
            if (currentFSNeedInit) {
                currentFSNeedInit = false
                onSelectFS(null, !useUiContextFn.getValue("autoload"))
            }
        }
        setupFileInput()
    }, [])
    const openFileUploadBrowser = () => {
        useUiContextFn.haptic()
        fileref.current.value = ""
        fileref.current.click()
    }
    const showCreateDirModal = () => {
        useUiContextFn.haptic()
        let name
        showModal({
            modals,
            title: T("S104"),
            button2: { text: T("S28") },
            button1: {
                cb: () => {
                    if (name.length > 0) createDirectory(name)
                },
                text: T("S106"),
            },
            icon: <Edit3 />,
            id: "inputName",
            content: (
                <Fragment>
                    <div>{T("S105")}</div>
                    <input
                        class="form-input"
                        onInput={(e) => {
                            name = e.target.value.trim()
                        }}
                    />
                </Fragment>
            ),
        })
    }

    useEffect(() => {
        const newMenu = () => {
            const rawMenuItems = [
                {
                    capability: "CreateDir",
                    label: T("S90"),
                    icon: (
                        <span class="feather-icon-container">
                            <FolderPlus size="0.8rem" />
                        </span>
                    ),
                    onClick: showCreateDirModal,
                },
                {
                    capability: "Upload",
                    label: T("S89"),
                    displayToggle: () => (
                        <span class="feather-icon-container">
                            <Upload size="0.8rem" />
                        </span>
                    ),
                    onClick: openFileUploadBrowser,
                },
                { divider: true },
                {
                    label: T("S50"),
                    onClick: onRefresh,
                    icon: (
                        <span class="feather-icon-container">
                            <RefreshCcw size="0.8rem" />
                        </span>
                    ),
                },
            ]
            const capabilities = ["CreateDir", "Upload"].filter((cap) =>
                files.capability(currentFS, cap)
            )

            return rawMenuItems.filter((item) => {
                if (item.capability)
                    return capabilities.includes(item.capability)
                if (item.divider && capabilities.length <= 0) return false
                return true
            })
        }
        setMenu(newMenu())
    }, [fileSystem])

    return (
        <div class="panel panel-dashboard" id={id}>
            <style>{styles}</style>
            <input
                type="file"
                ref={fileref}
                class="d-none"
                onChange={filesSelected}
            />
            <ContainerHelper id={id} />
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <HardDrive />
                    <strong class="text-ellipsis">{T("S65")}</strong>
                </span>

                <span class="navbar-section">
                    <span class="full-height">
                        {fileSystem != "" && !isLoading && (
                            <PanelMenu items={menu} />
                        )}
                        <FullScreenButton elementId={id} />
                        <CloseButton elementId={id} hideOnFullScreen={true} />
                    </span>
                </span>
            </div>

            {/* --- DOUBLE ROW TOOLBAR (RESPONSIVE) --- */}
            <div class="toolbar-container">
                
                {/* 1. SATIR: Navigasyon */}
                <div class="toolbar-row navigation toolbar-top-row">
                    <button class="toolbar-btn icon-only" onClick={onRefresh} title="Refresh Files">
                        <RefreshCcw size="16"/>
                    </button>
                    <select class="modern-select" onchange={onSelectFS} value={currentFS}>
                        {files.supported.map((element) => {
                            if (element.depend && element.depend()) return (<option value={element.value}>{T(element.name)}</option>)
                        })}
                    </select>
                </div>

                {/* 2. SATIR: Aksiyonlar (Mobilde Wrap Olur) */}
                <div class="toolbar-row actions toolbar-action-row">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button class="toolbar-btn primary" onClick={openFileUploadBrowser} title="Upload File">
                            <Upload size="16"/>
                            <span>Upload</span>
                        </button>
                        <button class="toolbar-btn" onClick={showCreateDirModal} title="New Folder">
                            <FolderPlus size="16"/>
                            <span>New Folder</span>
                        </button>
                    </div>

                    <div class="stop-container">
                        <div 
                            className="stop-btn-glow" 
                            onClick={handleStopPrint}
                            title="Stop Current Print"
                        >
                            <StopCircle size="16" />
                            <span>STOP PRINT</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DOSYA LISTESI (SCROLLABLE & RESPONSIVE) --- */}
            <div
                ref={dropRef}
                class="drop-zone m-2 p-1"
                onDragOver={(e) => { dropRef.current.classList.add("drop-zone--over"); e.preventDefault() }}
                onDragLeave={(e) => { dropRef.current.classList.remove("drop-zone--over"); e.preventDefault() }}
                onDragEnd={(e) => { dropRef.current.classList.remove("drop-zone--over"); e.preventDefault() }}
                onDrop={(e) => {
                     dropRef.current.classList.remove("drop-zone--over")
                    if (e.dataTransfer.files.length) {
                        const length = e.dataTransfer.items.length
                        if (!fileref.current.multiple && length > 1) { toasts.addToast({ content: T("S193"), type: "error" }); return }
                        if (e.dataTransfer.items && e.dataTransfer.items[0].webkitGetAsEntry()) {
                            for (let i = 0; i < length; i++) {
                                const entry = e.dataTransfer.items[i].webkitGetAsEntry()
                                if (entry.isDirectory) { toasts.addToast({ content: T("S192"), type: "error" }); return }
                            }
                        }
                    }
                    fileref.current.files = e.dataTransfer.files; filesSelected(e); e.preventDefault()
                }}
            >
                {isLoading && fileSystem != "" && (
                    <center>
                        <Loading class="m-2" />
                        <ButtonImg donotdisable icon={<XCircle />} label={T("S28")} onClick={onCancel} />
                    </center>
                )}

                {!isLoading && fileSystem != "" && filesList && (
                    <Fragment>
                        {currentPath[currentFS] != "/" && (
                            <div
                                className="file-card"
                                onclick={(e) => {
                                    useUiContextFn.haptic()
                                    const newpath = currentPath[currentFS].substring(0, currentPath[currentFS].lastIndexOf("/"))
                                    currentPath[currentFS] = newpath.length == 0 ? "/" : newpath
                                    onRefresh(e, files.capability(currentFS, "IsFlatFS"))
                                }}
                            >
                                <div className="file-info">
                                    <div className="file-icon-wrapper back"><CornerRightUp size="20" /></div>
                                    <span className="file-name" style={{ color: '#3b82f6' }}>...</span>
                                </div>
                            </div>
                        )}
                        
                        {filesList.files.map((line) => {
                            const isFolder = line.size == -1;
                            const isClickable = files.capability(fileSystem, "Download") || isFolder;
                            
                            return (
                                <div className="file-card">
                                    <div 
                                        className="file-info"
                                        onclick={(e) => { useUiContextFn.haptic(); ElementClicked(e, line) }}
                                        style={{ cursor: isClickable ? 'pointer' : 'default' }}
                                    >
                                        <div className={`file-icon-wrapper ${isFolder ? 'folder' : 'file'}`}>
                                            {isFolder ? <Folder size="22"/> : <File size="22"/>}
                                        </div>
                                        <div className="file-text-group">
                                            <div className="file-name" title={line.name}>{line.name}</div>
                                            {!isFolder && <div className="file-meta">{line.size}</div>}
                                        </div>
                                    </div>

                                    <div className="file-actions">
                                        {!isFolder && files.capability(currentFS, "Process", currentPath[currentFS], line.name) && (
                                            <div 
                                                className="action-icon-btn play tooltip tooltip-left" 
                                                data-tooltip={T("S74")}
                                                onClick={(e) => {
                                                    useUiContextFn.haptic();
                                                    const fullPath = (currentPath[currentFS] === "/" ? "" : currentPath[currentFS]) + "/" + line.name;
                                                    const cleanFullPath = fullPath.startsWith("/") ? fullPath.substring(1) : fullPath;
                                                    createNewRequest(
                                                        espHttpURL("command", { cmd: "M21" }), { method: "GET", echo: "M21" },
                                                        {
                                                            onSuccess: (result) => {
                                                                processData("response", result);
                                                                terminal.setPendingPrint({ longName: line.name, fullPath: cleanFullPath });
                                                                toasts.addToast({ content: `Getting file list: ${line.name}...`, type: "info" });
                                                                sendSerialCmd("M20 L");
                                                            },
                                                            onFail: (error) => { console.error("M21 Failed:", error); toasts.addToast({ content: "SD Init Failed!", type: "error" }); processData("error", error); }
                                                        }
                                                    );
                                                }}
                                            >
                                                <Play size="20" />
                                            </div>
                                        )}

                                        {files.capability(currentFS, isFolder ? "DeleteDir" : "DeleteFile", currentPath[currentFS], line.name) && (
                                            <div 
                                                className="action-icon-btn delete tooltip tooltip-left"
                                                data-tooltip={isFolder ? T("S101") : T("S100")}
                                                onClick={(e) => {
                                                    useUiContextFn.haptic();
                                                    const content = (<Fragment><div>{isFolder ? T("S101") : T("S100")} :</div><center><li>{line.name}</li></center></Fragment>)
                                                    showConfirmationModal({ modals, title: T("S26"), content, button1: { cb: () => deleteCommand(line), text: T("S27") }, button2: { text: T("S28") } })
                                                }}
                                            >
                                                <Trash2 size="20" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </Fragment>
                )}
            </div>

            {/* --- FOOTER (FIXED BOTTOM) --- */}
            <div class="files-list-footer p-2">
                {!isLoading && filesList && filesList.occupation && (
                    <div class="filelist-occupation d-flex align-items-center justify-content-between" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                         <div style={{ flex: 1 }}>
                            <div class="bar bar-sm" style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                                <div class="bar-item" role="progressbar" style={`width:${filesList.occupation}%; background-color: #3b82f6; border-radius: 4px;`}></div>
                            </div>
                        </div>
                        <div style={{ marginLeft: '10px', fontWeight: 'bold' }}>{filesList.occupation}%</div>
                    </div>
                )}
                 {!isLoading && filesList && filesList.status && (
                    <div class="file-status text-center mt-1" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{T(filesList.status)}</div>
                )}
            </div>
        </div>
    )
}

const FilesPanelElement = {
    id: "filesPanel",
    content: <FilesPanel />,
    name: "S65",
    icon: "HardDrive",
    show: "showfilespanel",
    onstart: "openfilesonstart",
    settingid: "files",
}

export { FilesPanel, FilesPanelElement }