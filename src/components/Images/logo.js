/*
 logo.js - ESP3D logo file
 Modified by DevMentor (2025)
*/

import { h } from "preact"
import { useSettingsContext } from "../../contexts"

const AppLogo = ({
    height = "50px",
    color = "currentColor",
    bgcolor = "white",
}) => {
    const { interfaceSettings } = useSettingsContext()
    
    // Eğer kullanıcı arayüz ayarlarından özel logo yüklediyse onu göster
    if (
        interfaceSettings.current &&
        interfaceSettings.current.custom &&
        interfaceSettings.current.custom.logo
    )
        return (
            <span
                dangerouslySetInnerHTML={{
                    __html: interfaceSettings.current.custom.logo
                        .replace("{height}", height)
                        .replaceAll("{color}", color)
                        .replaceAll("{bgcolor}", bgcolor),
                }}
            ></span>
        )
    else
        // YENİ ROOTCLAY LOGOSU (Her yerde geçerli olacak)
        return (
            <svg height={height} viewBox="100 290 410 200" enable-background="new 0 0 595.28 841.89" class="esp3dlogo" style={{verticalAlign: 'middle', color: color}}>
                <path fill="none" stroke={color} stroke-width="7.0866" stroke-miterlimit="22.9256" d="M140.005,322.083h336.307 c15.59,0,28.346,12.756,28.346,28.346v69.308c0,15.591-12.756,28.346-28.346,28.346H140.005c-15.59,0-28.346-12.755-28.346-28.346 V350.43C111.659,334.839,124.415,322.083,140.005,322.083L140.005,322.083z"></path>
                <polygon fill={color} stroke={color} fill-rule="evenodd" clip-rule="evenodd" points="508.164,318.522 432.027,318.522 508.164,395.771 508.164,318.522 "></polygon>
                <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill={color}>
                    <text x="308" y="375" font-weight="900" font-size="44" letter-spacing="-1">ROOTCLAY</text>
                    <text x="308" y="405" font-weight="bold" font-size="16" letter-spacing="6">CONTROLLER</text>
                </g>
            </svg>
        )
}

export { AppLogo }