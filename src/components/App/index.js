/*
 index.js - ESP3D WebUI App file
 Modified for RootClay Controller (Electron Support)
*/
import { h } from "preact"
import { useState } from "preact/hooks" // YENİ: useState eklendi
import ConnectModal from '../ConnectModal'; // YENİ: Modal import edildi

import {
    RouterContextProvider,
    HttpQueueContextProvider,
    UiContextProvider,
    SettingsContextProvider,
    DatasContextProvider,
    WsContextProvider,
} from "../../contexts"
import { TargetContextProvider } from "../../targets"
import { ContainerHelper } from "../Controls"
import { ContentContainer } from "../../areas"
import { ElementsCache } from "../../areas/elementsCache"

const App = () => {
    // YENİ: Bağlantı durumu kontrolü
    // Eğer tarayıcıdaysak (electronAPI yoksa) direkt bağlı varsayıyoruz (true)
    // Eğer Electron'daysak başlangıçta bağlı değiliz (false)
    const [isElectronConnected, setIsElectronConnected] = useState(
        window.electronAPI ? false : true
    );

    // YENİ: Eğer Electron'dayız ve henüz bağlanmadıysak MODAL'ı göster
    if (!isElectronConnected) {
        return (
            <ConnectModal 
                onConnect={() => setIsElectronConnected(true)} 
            />
        );
    }

    // Bağlantı tamamsa normal arayüzü göster
    return (
        <div id="app">
            <DatasContextProvider>
                <TargetContextProvider>
                    <RouterContextProvider>
                        <UiContextProvider>
                            <HttpQueueContextProvider>
                                <SettingsContextProvider>
                                    <WsContextProvider>
                                        <ContainerHelper id="top_container" active={true}/>
                                        <ElementsCache />
                                        <ContentContainer />
                                    </WsContextProvider>
                                </SettingsContextProvider>
                            </HttpQueueContextProvider>
                        </UiContextProvider>
                    </RouterContextProvider>
                </TargetContextProvider>
            </DatasContextProvider>
        </div>
    )
}

export { App }