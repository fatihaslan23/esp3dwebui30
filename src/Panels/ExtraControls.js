/*
 ExtraControls.js - ESP3D WebUI component file

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.
 
 Bu dosya, kullanıcı isteği üzerine Gemini tarafından yeniden yapılandırılmıştır (2025).
 Değişiklikler, kontrollerin ekstrudera göre gruplanmasını ve anında gösterilmesini içerir.

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.
 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.
 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

import { h, Fragment } from "preact"
import { useState, useRef } from "preact/hooks"
import { T } from "../Translations"
import { Sliders, Send } from "preact-feather"
import { useUiContext, useUiContextFn } from "../../contexts"
import { useTargetContext } from "../../targets"
import {
    ButtonImg,
    Loading,
    Field,
    FullScreenButton,
    CloseButton,
} from "../Controls"
import { useHttpFn } from "../../hooks"
import { espHttpURL } from "../Helpers"
import { ContainerHelper } from "../Controls"

const target_values = [[], [], []]

const isVisible = (pos) => {
    const setting = ["showfanctrls", "showflowratectrls", "showspeedctrls"]

    return setting[pos] != undefined
        ? useUiContextFn.getValue(setting[pos])
        : false
}

const presetList = (pos) => {
    const setting = ["fanpresets", "flowratepresets", "speedpresets"]
    if (setting[pos] != undefined) {
        const list = useUiContextFn.getValue(setting[pos])
        if (list)
            return list.split(";").map((item) => {
                return { display: item + "%", value: item }
            })
    }
    return ""
}

const controlCommand = (pos, index, value) => {
    const setting = ["fancmd", "flowratecmd", "speedcmd"]

    if (setting[pos] != undefined) {
        const cmd = useUiContextFn.getValue(setting[pos])
        if (cmd)
            return cmd
                .replace("#", index)
                .replace("$", pos == 0 ? (parseInt(value) * 255) / 100 : value)
    }
    return ""
}

const controlMinMax = (pos) => {
    const setting = ["fanpresets", "flowratepresets", "speedpresets"]
    if (setting[pos] != undefined) {
        const element = useUiContextFn.getElement(setting[pos])
        if (element) {
            let limits = { min: element.min, max: element.max };
            
            // pos: 1 -> Flowrate, pos: 2 -> Speed
            if (pos === 1 || pos === 2) {
                limits.max = 1000;
            }
            return limits;
        }
    }
    return { min: 0, max: 100 }
}

const ExtraControls = () => {
    const { temperatures, fanSpeed, flowRate, feedRate, sensor } =
        useTargetContext()
    if (
        !(
            useUiContextFn.getValue("showfanctrls") ||
            useUiContextFn.getValue("showflowratectrls") ||
            useUiContextFn.getValue("showfeedratectrls") ||
            useUiContextFn.getValue("showsensorctrls")
        )
    )
        return null
    return (
        <div class="extra-ctrls">
            {useUiContextFn.getValue("showfanctrls") &&
                fanSpeed.current.map((element, index) => {
                    const desc =
                        T("P31") +
                        (temperatures["T"].length > 1 ? " " + (index + 1) : "")
                    if (typeof element != "undefined")
                        return (
                            <div
                                class="extra-control mt-1 tooltip tooltip-bottom"
                                data-tooltip={desc}
                            >
                                <div class="extra-control-header">{desc}</div>
                                <div class="extra-control-value">{element}%</div>
                            </div>
                        )
                })}
            {useUiContextFn.getValue("showflowratectrls") &&
                flowRate.current.map((element, index) => {
                    const desc =
                        T("P30") +
                        (temperatures["T"].length > 1 ? " " + (index + 1) : "")
                    if (typeof element != "undefined")
                        return (
                            <div
                                class="extra-control mt-1 tooltip tooltip-bottom"
                                data-tooltip={desc}
                            >
                                <div class="extra-control-header">{desc}</div>
                                <div class="extra-control-value">{element}%</div>
                            </div>
                        )
                })}
            {useUiContextFn.getValue("showspeedctrls") &&
                feedRate.current.map((element, index) => {
                    const desc = T("P12")
                    if (typeof element != "undefined")
                        return (
                            <div
                                class="extra-control mt-1 tooltip tooltip-bottom"
                                data-tooltip={desc}
                            >
                                <div class="extra-control-header">{desc}</div>
                                <div class="extra-control-value">{element}%</div>
                            </div>
                        )
                })}
        </div>
    )
}

// Lütfen bu fonksiyonun tamamını ExtraControls.js dosyanızdaki mevcut ExtraInputControl ile değiştirin

const ExtraInputControl = ({ element, index, size, pos }) => {
    if (!isVisible(pos)) return null
    const { toasts } = useUiContext()
    const { createNewRequest } = useHttpFn
    const sendCommand = (command) => {
        createNewRequest(
            espHttpURL("command", { cmd: command }),
            { method: "GET", echo: command },
            {
                onSuccess: (result) => {},
                onFail: (error) => {
                    toasts.addToast({ content: error, type: "error" })
                },
            }
        )
    }
    const [validation, setvalidation] = useState({
        message: null,
        valid: true,
        modified: false,
    })
    
    if (typeof target_values[pos][index] == "undefined") {
        target_values[pos][index] = {}
        target_values[pos][index].current =
            typeof element.list.current[index] == "undefined" ||
            element.list.current[index] == -1
                ? pos == 0
                    ? 0
                    : 100
                : element.list.current[index]
    }
    if (typeof target_values[pos][index].min == "undefined") {
        const minmax = controlMinMax(pos)
        if (minmax) {
            target_values[pos][index].min = parseInt(minmax.min)
            target_values[pos][index].max = parseInt(minmax.max)
        }
    }
    const boundaries = controlMinMax(pos)
    const generateValidation = (tool, index) => {
        let validation = {
            message: null,
            valid: true,
            modified: false,
        }
        const currentValue = Number(target_values[tool][index].current);
        if (
            isNaN(currentValue) ||
            currentValue < target_values[tool][index].min ||
            currentValue > target_values[tool][index].max
        ) {
            validation.valid = false
        }

        return validation
    }
    
    // Tekrarlanan kodu önlemek için yeniden kullanılabilir bir gönderme fonksiyonu
    const handleSendCommand = () => {
        useUiContextFn.haptic();
        const cmds = controlCommand(
            pos,
            index,
            target_values[pos][index].current
        ).split(";")
        cmds.forEach((cmd) => {
            sendCommand(cmd)
        })
        element.list.current[index] =
            target_values[pos][index].current
    };

    // Enter tuşuna basıldığını dinleyen fonksiyon
    const handleKeyUp = (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
        // Tarayıcının varsayılan Enter davranışını (form gönderme gibi) engelle
        e.preventDefault(); 
        
        // Komutu gönder
        handleSendCommand(); 
        
        // Input alanındaki tüm metni seçili hale getir
        e.target.select(); 
    }
    };

    return (
        <div class="extra-ctrls-container m-1">
            <div class="extra-ctrl-name">
                {T(element.name)
                    .replace("$", size > 1 ? " " + (index + 1) : "")
                    .trim()}
            </div>
            <div class="extra-ctrls-container2">
                <div>
                    <Field
                        id={"input-extra-" + pos + "-" + index}
                        type="number"
                        value={target_values[pos][index].current}
                        min={boundaries.min}
                        step="1"
                        max={boundaries.max}
                        width="4rem"
                        extra="dropList"
                        append="%"
                        options={presetList(pos)}
                        setValue={(val, update) => {
                            if (!update) {
                                target_values[pos][index].current = val
                            }
                            setvalidation(generateValidation(pos, index))
                        }}
                        validation={validation}
                        onKeyUp={handleKeyUp} // YENİ EKLENDİ: onKeyUp olayını bağlıyoruz
                    />
                </div>
                <ButtonImg
                    id={"btn-send-extra-" + pos + "-" + index}
                    class={`extra-ctrl-send ${
                        !validation.valid ? "d-invisible" : ""
                    }`}
                    icon={<Send />}
                    tooltip
                    data-tooltip={T("S43")}
                    onClick={(e) => { // DEĞİŞTİRİLDİ: Artık direkt olarak yeniden kullanılabilir fonksiyonu çağırıyor
                        e.target.blur()
                        handleSendCommand()
                    }}
                />
            </div>
        </div>
    )
}
const ExtraControlsPanel = () => {
    const { temperatures, fanSpeed, flowRate, feedRate } = useTargetContext()
    const id = "extraControlsPanel"
    const inputList = [
        { name: "P91", list: fanSpeed },    // pos: 0 -> Fan
        { name: "P92", list: flowRate },   // pos: 1 -> Flowrate
        { name: "P93", list: feedRate },     // pos: 2 -> Speed
    ]

    return (
        <div class="panel panel-dashboard" id={id} >
            <ContainerHelper id={id} />
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Sliders />
                    <strong class="text-ellipsis">{T("P96")}</strong>
                </span>
                <span class="navbar-section">
                    <span class="full-height">
                        <FullScreenButton elementId={id} />
                        <CloseButton elementId={id} hideOnFullScreen={true} />
                    </span>
                </span>
            </div>
            <div class="panel-body panel-body-dashboard">
                <ExtraControls />
                <div class="divider"/>

                <div class="p-2">
                    {(() => {
                        const displayCount = temperatures["T"]?.length > 0 ? temperatures["T"].length : 1;
                        
                        return (
                            <Fragment>
                                {/* HER EXTRUDER İÇİN DÖNGÜ */}
                                {Array.from({ length: displayCount }).map((_, index) => (
                                    <div key={`extruder-group-${index}`} class="mb-2">
                                        {/* Extruder Başlığı (Sadece birden fazla extruder varsa) */}
                                        {displayCount > 1 && <h6 class="text-gray text-center">Extruder {index + 1}</h6>}
                                        
                                        {/* 1. SATIR: FAN KONTROLÜ (Tam Genişlik) */}
                                        {isVisible(0) && (
                                            <div class="mb-1">
                                                <ExtraInputControl element={inputList[0]} index={index} size={displayCount} pos={0}/>
                                            </div>
                                        )}

                                        {/* 2. SATIR: FLOW VE SPEED (Yan Yana) */}
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {/* FLOW RATE (Sol Taraf) */}
                                            {isVisible(1) && (
                                                <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0 taşmayı önler */}
                                                    <ExtraInputControl element={inputList[1]} index={index} size={displayCount} pos={1}/>
                                                </div>
                                            )}
                                            
                                            {/* SPEED (Sağ Taraf - Sadece genel kontrol ise sadece ilk döngüde gösterilebilir ama buradaki mantığa göre her extruder için ayrı olabilir) */}
                                            {/* Not: Speed genelde globaldir, ama senin kodunda dizi yapısı var. Eğer global ise sadece index 0'da gösterilmeli */}
                                            {isVisible(2) && (
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <ExtraInputControl element={inputList[2]} index={0} size={1} pos={2} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Ayırıcı Çizgi (Son eleman hariç) */}
                                        {displayCount > 1 && index < displayCount -1 && <div class="divider mt-2"/>}
                                    </div>
                                ))}
                            </Fragment>
                        );
                    })()}
                </div>
            </div>
        </div>
    )
}

const ExtraControlsPanelElement = {
    id: "extraControlsPanel",
    content: <ExtraControlsPanel />,
    name: "P96",
    icon: "Sliders",
    show: "showextracontrolspanel",
    onstart: "openextracontrolsonstart",
    settingid: "controls",
}

export { ExtraControlsPanel, ExtraControlsPanelElement, ExtraControls }