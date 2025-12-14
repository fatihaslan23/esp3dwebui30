/*
  CustomMacros.js - ESP3D WebUI custom G-code macros component

  This file is based on the structure of the ESP3D-WEBUI project.
  You can modify and adapt it to your needs.
*/

import { Fragment, h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Play, Plus, Edit, Trash2, Sliders } from "preact-feather"; // Kullanacağımız ikonlar
import { useHttpFn } from "../../hooks";
import { espHttpURL } from "../Helpers";
import { useUiContext, useUiContextFn } from "../../contexts";
import { T } from "../Translations";
import { Button, FullScreenButton, CloseButton, ContainerHelper } from "../Controls";
import { showModal } from "../Modal";
import { Menu as PanelMenu } from "./";

// --- ANA BİLEŞEN ---
const CustomMacrosPanel = () => {
    const { toasts, modals } = useUiContext();
    const { createNewRequest } = useHttpFn();

    // Butonlarımızı bu state içinde tutacağız. Her buton bir objedir.
    const [macros, setMacros] = useState([]);
    
    // Değişikliklerin ESP'ye kaydedilip edilmediğini takip etmek için bir bayrak.
    // Bu, ilk yüklemede boş verinin kaydedilmesini engeller.
    const [isLoaded, setIsLoaded] = useState(false);


    // --- YARDIMCI FONKSİYONLAR ---

    // ESP32'ye G-code komutu gönderir (Jog.js'den uyarlandı)
    const SendCommand = (command) => {
        if (!command || command.trim() === "") return;
        createNewRequest(
            espHttpURL("command", { cmd: command }),
            { method: "GET", echo: command },
            {
                onSuccess: (result) => {
                    toasts.addToast({ content: `OK: ${command}`, type: "success", timeout: 2000 });
                },
                onFail: (error) => {
                    toasts.addToast({ content: `Error: ${command} -> ${error}`, type: "error" });
                    console.error(error);
                },
            }
        );
    };


    // --- VERİ KALICILIĞI (KAYDETME VE YÜKLEME) ---

    // Bileşen ilk yüklendiğinde ESP'den kayıtlı macroları yükler.
    useEffect(() => {
        // TODO: Burası, ESP3D'nin ayarları okuma mekanizmasına göre düzenlenmelidir.
        // Genellikle /files/config.json dosyasını okuyarak veya özel bir API 
        // endpoint'i çağırarak yapılır. `useUiContextFn.getValue` kullanılabilir.
        // Şimdilik, çalışmayı görebilmeniz için örnek verilerle başlatıyoruz.
        
        console.log("Attempting to load macros from settings...");
        // const loadedMacros = useUiContextFn.getValue("custom_macros"); // Gerçek kodda bu satır kullanılabilir.
        
        // ---- ÖRNEK VERİ (Başlangıç için) ----
        const loadedMacros = [
            { id: 1, name: "Yatağı Isıt (PLA)", gcode: "M140 S60\nM190 S60" },
            { id: 2, name: "Nozzle Temizle", gcode: "G1 Z10 F3000\nG1 X10 Y10 F5000\nG92 E0\nG1 E80 F400\nG1 E75 F400" },
            { id: 3, name: "Filament Değiştir", gcode: "M600" }
        ];
        // ------------------------------------

        if (loadedMacros && Array.isArray(loadedMacros)) {
            setMacros(loadedMacros);
            console.log("Macros loaded successfully.");
        } else {
            console.log("No custom macros found, starting with empty list.");
        }
        setIsLoaded(true); // Yükleme tamamlandı.
    }, []); // Boş dizi, bu etkinin sadece bileşen ilk yüklendiğinde çalışmasını sağlar.

    // `macros` state'i her değiştiğinde bu fonksiyon çalışır ve ayarları ESP'ye kaydeder.
    useEffect(() => {
        // Eğer ilk yükleme henüz bitmediyse, boş bir listeyi kaydetmeyi önle.
        if (!isLoaded) {
            return;
        }

        // TODO: Burası, ESP3D'nin ayarları kaydetme mekanizmasına göre düzenlenmelidir.
        // Genellikle `[ESP400]ayar=değer` formatında bir komut gönderilir.
        // `JSON.stringify` ile diziyi metne çevirip göndermeniz gerekecektir.
        
        console.log("Saving macros to ESP...", macros);
        const settingsString = JSON.stringify(macros);
        // const command = `[ESP400]custom_macros=${settingsString}`;
        // SendCommand(command); // Gerçek kodda bu satır aktif edilmelidir.
        
        toasts.addToast({ content: "Macro listesi güncellendi.", type: "info", timeout: 1500 });

    }, [macros, isLoaded]); // `macros` veya `isLoaded` değiştiğinde tetiklenir.


    // --- BUTON AKSİYONLARI ---

    // Bir macroyu çalıştırır.
    const executeMacro = (gcode) => {
        useUiContextFn.haptic();
        const commands = gcode.split('\n').filter(cmd => cmd.trim() !== "");
        if (commands.length === 0) {
            toasts.addToast({ content: "Bu macroda çalıştırılacak G-code bulunmuyor.", type: "warning" });
            return;
        }
        toasts.addToast({ content: `${commands.length} komut gönderiliyor...`, type: "info" });
        commands.forEach(cmd => {
            SendCommand(cmd);
        });
    };

    // Bir macroyu siler.
    const deleteMacro = (idToDelete) => {
        useUiContextFn.haptic();
        setMacros(macros.filter(macro => macro.id !== idToDelete));
    };

    // Yeni macro ekleme veya mevcut macroyu düzenleme penceresini açar.
    const openMacroModal = (macroToEdit = null) => {
        let macroName = macroToEdit ? macroToEdit.name : "";
        let macroGcode = macroToEdit ? macroToEdit.gcode : "";

        showModal({
            modals,
            title: macroToEdit ? "Macro'yu Düzenle" : "Yeni Macro Ekle",
            icon: macroToEdit ? <Edit /> : <Plus />,
            content: (
                <Fragment>
                    <input
                        class="form-input"
                        placeholder="Buton Adı (örn: Yatağı Isıt)"
                        value={macroName}
                        onInput={(e) => macroName = e.target.value}
                    />
                    <textarea
                        class="form-input mt-2"
                        placeholder={"G-code komutları (her satıra bir komut)\nÖrnek:\nM140 S60\nM109 S200"}
                        rows="8"
                        onInput={(e) => macroGcode = e.target.value}
                    >{macroGcode}</textarea>
                </Fragment>
            ),
            button1: {
                text: "Kaydet",
                cb: () => {
                    if (!macroName || !macroGcode) {
                        toasts.addToast({ content: "Buton adı ve G-code boş olamaz.", type: "error" });
                        return;
                    }
                    if (macroToEdit) {
                        // Var olanı düzenle
                        setMacros(macros.map(macro =>
                            macro.id === macroToEdit.id
                                ? { ...macro, name: macroName, gcode: macroGcode }
                                : macro
                        ));
                    } else {
                        // Yeni ekle
                        const newMacro = { id: Date.now(), name: macroName, gcode: macroGcode };
                        setMacros([...macros, newMacro]);
                    }
                }
            },
            button2: { text: "İptal" }
        });
    };


    // --- ARAYÜZ (JSX) ---
    return (
        <div class="panel panel-dashboard" id="customMacrosPanel">
            <ContainerHelper id="customMacrosPanel" />
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Sliders />
                    <strong class="text-ellipsis">Macro Butonları</strong>
                </span>
                <span class="navbar-section">
                    <Button m1 tooltip data-tooltip="Yeni Macro Ekle" onclick={() => openMacroModal()}>
                        <Plus size="1.2rem" />
                    </Button>
                    <FullScreenButton elementId="customMacrosPanel" />
                    <CloseButton elementId="customMacrosPanel" hideOnFullScreen={true} />
                </span>
            </div>
            <div class="panel-content p-2" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', alignContent: 'flex-start' }}>
                {macros.length > 0 ? (
                    macros.map((macro) => (
                        <div key={macro.id} class="d-flex m-1" style={{ alignItems: 'stretch' }}>
                            <Button
                                primary
                                className="flex-grow"
                                onclick={() => executeMacro(macro.gcode)}
                            >
                                <Play size="1rem" style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                                {macro.name}
                            </Button>
                            <Button className="px-2" onclick={() => openMacroModal(macro)}>
                                <Edit size="1rem" />
                            </Button>
                            <Button danger className="px-2" onclick={() => deleteMacro(macro.id)}>
                                <Trash2 size="1rem" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <div class="blankslate">
                        <p>Henüz macro oluşturulmadı.</p>
                        <p>
                            <Button primary onclick={() => openMacroModal()}>
                                <Plus size="1rem" style={{ verticalAlign: 'middle' }} /> İlk Macro'nu Ekle
                            </Button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Yeni sekmemizi sisteme tanıtan obje
const CustomMacrosPanelElement = {
    id: "customMacrosPanel",
    content: <CustomMacrosPanel />,
    name: "S_CUSTOM_MACROS", // Çeviri dosyanıza "Custom Macros" karşılığı olarak ekleyebilirsiniz
    icon: "Sliders",        // Feather Icons'dan bir ikon adı
    show: "showcustommacropanel",
    onstart: "opencustommacroonstart",
    settingid: "custommacros",
};

export { CustomMacrosPanel, CustomMacrosPanelElement };