/* src/adapters/httpAdapter.js - TAM VE KONTROL EDİLMİŞ VERSİYON */

/**
 * Execute XMLHttpRequest
 * @param {string} url
 * @param {Object} params
 * @param {Function} setUploadProgress
 * @returns {Object} { abort, xhr, response }
 */
const httpAdapter = (url, params = {}, setUploadProgress = () => {}) => {
    const { method = "GET", headers = {}, body = null, id = null } = params
    const sanitizedMethod = method.trim().toUpperCase()
    const xhr = new XMLHttpRequest()
    
    let finalUrl = url; 

    // *** PROGRESS LISTENER KISMI ***
    if (id && id.startsWith("download")) {
        xhr.responseType = "blob"
        xhr.addEventListener("progress", (e) => {
            const done = e.position || e.loaded
            const total = e.totalSize || e.total
            const perc = Math.floor((done / total) * 1000) / 10
            setUploadProgress(perc)
        })
    } else {
        xhr.upload.addEventListener("progress", (e) => {
            const done = e.position || e.loaded
            const total = e.totalSize || e.total
            const perc = Math.floor((done / total) * 1000) / 10
            setUploadProgress(perc)
        })
    }
    // *** PROGRESS LISTENER KISMI SONU ***

    const cacheBustedUrl = (url) => {
        const parsedUrl = new URL(url, window.location.origin)
        let params = parsedUrl.searchParams
        params.get("t") == null && params.append("t", Date.now())
        return parsedUrl.pathname + parsedUrl.search;
    }

    xhr.open(sanitizedMethod, cacheBustedUrl(finalUrl), true) 

    /** header part */
    // KRİTİK DÜZELTME: Başlıkları XHR objesine ekliyoruz.
    if (headers instanceof Headers)
        headers.forEach((value, header) => xhr.setRequestHeader(header, value))
    else if (typeof headers === 'object' && headers !== null) 
        Object.entries(headers).forEach(([header, value]) => // Dizi ayrıştırma doğru yapıldı
            xhr.setRequestHeader(header, value)
        ) 

    const response = new Promise((resolve, reject) => {
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response)
            else {
                const e = new Error(
                    `${xhr.status ? xhr.status : ""}${
                        xhr.statusText ? ` - ${xhr.statusText}` : ""
                    }`
                )
                e.code = xhr.status
                reject(e)
            }
        }
        xhr.onerror = () => {
            const e = new Error(
                `${xhr.status ? xhr.status : "Connection time out"}${
                    xhr.status && xhr.statusText ? ` - ${xhr.statusText}` : ""
                }`
            )
            e.code = xhr.status
            reject(e)
        }

        xhr.onabort = () => {
            const e = new Error("Request aborted")
            e.code = 499
            reject(e)
        }
    })
    
    const needsBody = ["POST", "PUT", "CONNECT", "PATCH"].includes(sanitizedMethod)

    const sendBody = needsBody
        ? body
        : null

    xhr.send(sendBody)
    
    return {
        abort: (cb) => {
            xhr.abort()
            if (typeof cb == "function") return cb() 
        },
        xhr,
        response,
    }
}

export { httpAdapter }