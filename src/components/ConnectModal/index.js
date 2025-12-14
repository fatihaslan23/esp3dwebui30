/* src/components/ConnectModal/index.js */
import { h, Component } from 'preact';
import { setAdapter } from '../../adapters';

export default class ConnectModal extends Component {
    constructor() {
        super();
        this.state = {
            mode: null, // 'wifi' veya 'usb'
            ports: [],
            selectedPort: '',
            wifiIP: localStorage.getItem('lastIP') || '192.168.0.1',
            status: ''
        };
    }

    // USB Portlarını Tara
    async scanPorts() {
        if (window.electronAPI) {
            const ports = await window.electronAPI.listPorts();
            this.setState({ ports, selectedPort: ports.length > 0 ? ports[0].path : '' });
        }
    }

    // Bağlan Butonuna Basılınca
    async connect() {
        const { mode, selectedPort, wifiIP } = this.state;
        this.setState({ status: 'Bağlanıyor...' });

        try {
            if (mode === 'usb') {
                // USB Moduna Geç
                const adapter = setAdapter('usb');
                await adapter.connect(selectedPort);
                
                // Başarılı! Ana Ekrana Geç
                this.props.onConnect(); 
            } else {
                // Wi-Fi Moduna Geç (IP Adresini Ayarla)
                localStorage.setItem('lastIP', wifiIP);
                
                // HttpAdapter IP adresini window.location yerine buradan almalı
                // (Bunun için HttpAdapter'da küçük bir ayar gerekecek, şimdilik varsayalım)
                setAdapter('wifi'); 
                
                // Ana Ekrana Geç
                this.props.onConnect();
            }
        } catch (err) {
            this.setState({ status: 'Hata: ' + err });
        }
    }

    render({}, { mode, ports, selectedPort, wifiIP, status }) {
        // Stil: Basit bir Modal
        const modalStyle = {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999, color: 'white', flexDirection: 'column'
        };

        const boxStyle = {
            backgroundColor: '#34495e', padding: '40px', borderRadius: '10px', 
            textAlign: 'center', minWidth: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        };

        return (
            <div style={modalStyle}>
                <div style={boxStyle}>
                    <h1>RootClay Controller</h1>
                    <p>Lütfen bağlantı yöntemini seçin</p>
                    
                    {/* ADIM 1: SEÇİM BUTONLARI */}
                    {!mode && (
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
                            <button 
                                class="btn btn-primary" 
                                onClick={() => { this.setState({ mode: 'usb' }); this.scanPorts(); }}
                                style={{ padding: '15px 30px', fontSize: '18px' }}
                            >
                                🔌 USB / Serial
                            </button>
                            <button 
                                class="btn btn-primary" 
                                onClick={() => this.setState({ mode: 'wifi' })}
                                style={{ padding: '15px 30px', fontSize: '18px' }}
                            >
                                📡 Wi-Fi
                            </button>
                        </div>
                    )}

                    {/* ADIM 2: USB AYARLARI */}
                    {mode === 'usb' && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>USB Bağlantısı</h3>
                            {ports.length === 0 ? <p>Cihaz aranıyor...</p> : (
                                <select 
                                    value={selectedPort} 
                                    onChange={(e) => this.setState({ selectedPort: e.target.value })}
                                    style={{ padding: '10px', width: '100%', marginBottom: '20px', color: 'black' }}
                                >
                                    {ports.map(p => <option value={p.path}>{p.path} ({p.manufacturer || 'Unknown'})</option>)}
                                </select>
                            )}
                            <button class="btn btn-success" onClick={() => this.connect()}>BAĞLAN</button>
                            <br/><br/>
                            <button class="btn btn-link" onClick={() => this.setState({ mode: null })}>Geri Dön</button>
                        </div>
                    )}

                    {/* ADIM 3: WI-FI AYARLARI */}
                    {mode === 'wifi' && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>Wi-Fi Bağlantısı</h3>
                            <input 
                                type="text" 
                                value={wifiIP} 
                                onInput={(e) => this.setState({ wifiIP: e.target.value })}
                                placeholder="Örn: 192.168.1.50"
                                style={{ padding: '10px', width: '100%', marginBottom: '20px', color: 'black' }}
                            />
                            <button class="btn btn-success" onClick={() => this.connect()}>BAĞLAN</button>
                            <br/><br/>
                            <button class="btn btn-link" onClick={() => this.setState({ mode: null })}>Geri Dön</button>
                        </div>
                    )}
                    
                    {status && <p style={{ color: 'orange', marginTop: '10px' }}>{status}</p>}
                </div>
            </div>
        );
    }
}