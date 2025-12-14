/*
 Navbar.js - ESP3D WebUI navigation bar file
 Modified by DevMentor (2025) - Centered Logo
*/
import { Fragment, h } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import { iconsFeather } from "../Images"
import { iconsTarget } from "../../targets" // AppLogo'yu sildim, gerek kalmadı
import { Link } from "../Router"
import { T } from "../Translations"
import {
    useSettingsContext,
    useUiContext,
    useWsContext,
    useRouterContext,
    useUiContextFn,
} from "../../contexts"
import { useHttpQueue } from "../../hooks"
import { espHttpURL } from "../Helpers"
import { showConfirmationModal } from "../Modal"
import {
    Server,
    Settings,
    Activity,
    LogOut,
    Trello,
    ChevronDown,
} from "preact-feather"

/*
 * Local const
 */

// 1. LOGO BİLEŞENİ (AYNI KALDI)
const RootClayNavbarLogo = () => (
    <svg 
        viewBox="100 345 410 105" 
        style={{ height: "42px", verticalAlign: "middle", color: "currentColor" }} 
        className="esp3dlogo"
    >
        <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fill="currentColor">
            <text x="305" y="405" text-anchor="middle" font-weight="900" font-size="72" letter-spacing="-2">ROOTCLAY</text>
            <text x="305" y="442" text-anchor="middle" font-weight="bold" font-size="28" letter-spacing="19">CONTROLLER</text>
        </g>
    </svg>
)

// 2. DEFAULT LINKS LİSTESİNDEN LOGOYU ÇIKARDIM
// Logo artık burada değil, aşağıda manuel ekleyeceğiz.
const defaultLinks = [
    { label: "S123", icon: <Activity />, href: "/informations" },
    {
        label: "S13",
        icon: <Server />,
        href: "/dashboard",
        id: "dashboardLink",
    },
    {
        label: "S14",
        icon: <Settings />,
        href: "/settings",
        id: "settingsLink",
    },
]

const Navbar = () => {
    const { connectionSettings } = useSettingsContext()
    const { defaultRoute } = useRouterContext()
    const { modals, uisettings } = useUiContext()
    const { createNewRequest } = useHttpQueue()
    const { Disconnect } = useWsContext()
    const buttonExtraPage = useRef()
    const menuExtraPage = useRef()
    const iconsList = { ...iconsTarget, ...iconsFeather }
    const [textbutton, setTextButton] = useState(
        <Fragment>
            <Trello />
            <label class="hide-low">{T("S155")}</label>
        </Fragment>
    )
    const [hrefbutton, setHrefButton] = useState()

    function onResize() {
        if (
            document.getElementById("infopage") &&
            document.getElementById("infopage").clientWidth == 0
        ) {
            document
                .getElementById(
                    defaultRoute.current == "/dashboard"
                        ? "dashboardLink"
                        : "settingsLink"
                )
                .click()
        }
    }
    const disconnectNow = () => {
        const formData = new FormData()
        formData.append("DISCONNECT", "YES")
        createNewRequest(
            espHttpURL("login"),
            { method: "POST", id: "login", body: formData },
            {
                onSuccess: (result) => { Disconnect("sessiontimeout") },
                onFail: (error) => { Disconnect("sessiontimeout") },
            }
        )
    }
    const menuLinks = []
    if (uisettings.current) {
        if (uisettings.getValue("showextracontents")) {
            const extraContents = uisettings.getValue("extracontents")
            const extraPages = extraContents.reduce((acc, curr) => {
                const item = curr.value.reduce((accumulator, current) => {
                    accumulator[current.name] = current.initial
                    return accumulator
                }, {})

                if (item.target == "page") {
                    const pageIcon = iconsList[item.icon] ? iconsList[item.icon] : ""
                    acc.push({
                        label: item.name,
                        icon: pageIcon,
                        href: "/#/extrapage/" + curr.id,
                        id: curr.id,
                    })
                }
                return acc
            }, [])
            menuLinks.push(...extraPages)
        }
    }
    useEffect(() => {
        new ResizeObserver(onResize).observe(document.getElementById("app"))
    }, [])

    const onDisconnect = () => {
        useUiContextFn.haptic()
        showConfirmationModal({
            modals,
            title: T("S26"),
            content: T("S152"),
            button1: { cb: disconnectNow, text: T("S27") },
            button2: { text: T("S28") },
        })
    }

    if (uisettings.current) {
        return (
    <header 
        class="navbar" 
        style={{
            // YENİ EKLENEN FLEXBOX STİLLERİ:
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between', // Sol ve sağ bölümleri kenarlara it
            padding: '0.4rem 0', // Biraz dikey boşluk (isteğe bağlı ayarlanabilir)
        }}
    > 
        
        {/* SOL BÖLÜM: Linkler (Değişiklik yok) */}
        <section class="navbar-section" style={{flex: '1'}}> {/* flex: 1 ile sol tarafa alan ayır */}
            {defaultLinks &&
                defaultLinks.map(({ label, icon, href, id }) => {
                    if (href == "/informations" && !uisettings.getValue("showinformationpage")) return
                    return (
                        <Link
                            onclick={(e) => {
                                useUiContextFn.haptic()
                                if (buttonExtraPage.current) buttonExtraPage.current.classList.remove("active")
                            }}
                            id={id}
                            className={href == "/about" ? "navbar-brand logo no-box " : (connectionSettings.current.FWTarget == 0 && href == "/dashboard" ? "d-none" : "btn btn-link no-box feather-icon-container")}
                            activeClassName="active"
                            href={href}
                        >
                            {icon}
                            <label class={href == "/about" ? "" : "hide-low"}>
                                {T(label)}
                            </label>
                        </Link>
                    )
                })}
            
            {/* Extra Pages Logic (Aynı kaldı) */}
            {menuLinks && menuLinks.length > 0 && (
                <Fragment>
                    {hrefbutton && (
                        <Link id="extrapagebutton" className="btn btn-link no-box feather-icon-container" activeClassName="active" href={hrefbutton}>
                            {textbutton}
                        </Link>
                    )}
                    <div class="dropdown dropdown-right">
                        <a class="btn btn-link no-box dropdown-toggle feather-icon-container" ref={buttonExtraPage} onclick={(e) => { useUiContextFn.haptic(); if (menuExtraPage.current) menuExtraPage.current.classList.remove("d-none"); }} tabindex="0">
                            {!hrefbutton && (<label class="hide-low">{T("S155")}</label>)}
                            <ChevronDown />
                        </a>
                        <ul class="menu" ref={menuExtraPage}>
                            {menuLinks && menuLinks.map(({ label, icon, href, id }) => {
                                return (
                                    <li class="menu-item">
                                        <a id={id} class="feather-icon-container" href={href} onclick={(e) => { useUiContextFn.haptic(); if (menuExtraPage.current) menuExtraPage.current.classList.add("d-none"); if (buttonExtraPage.current) buttonExtraPage.current.classList.add("active"); setTextButton(<Fragment>{icon}<label class="hide-low">{label}</label></Fragment>); setHrefButton(href.replace("#/", "")); }}>
                                            {icon} <label>{label}</label>
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </Fragment>
            )}
        </section>

        {/* ORTA BÖLÜM: LOGO (GÜNCELLENDİ) */}
        {/* Absolute yerine Flexbox ile ortalama */}
        <section class="navbar-center" style={{
            flex: '2', // Ortaya daha fazla alan ver
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
                <Link
                onclick={() => useUiContextFn.haptic()}
                href="/about"
                className="navbar-brand logo no-box"
                style={{display: 'flex', alignItems: 'center'}}
            >
                <RootClayNavbarLogo />
            </Link>
        </section>

        {/* SAĞ BÖLÜM: Logout (GÜNCELLENDİ) */}
        <section class="navbar-section" style={{
            flex: '1', // Sağ tarafa alan ayır
            display: 'flex',
            justifyContent: 'flex-end' // İçeriği sağa yasla
        }}>
            <span
                className={connectionSettings.current.Authentication == "Disabled" ? "d-none" : "btn btn-link no-box mx-2 feather-icon-container"}
                onClick={onDisconnect}
            >
                <LogOut />
                <label style="cursor:pointer;" class="hide-low">
                    {T("S151")}
                </label>
            </span>
        </section>
    </header>
)
    }
}

export { Navbar }