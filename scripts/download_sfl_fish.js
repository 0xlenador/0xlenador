import fs from "fs"
import path from "path"

const TARGET_URL = "https://www.sfl.world/info/fishing/info"
const OUTPUT_DIR = path.resolve("public/img/sunflowerland/fish/a")

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  console.log(`Fetching ${TARGET_URL}...`)
  const res = await fetch(TARGET_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  })

  if (!res.ok) {
    console.error(`Failed to fetch ${TARGET_URL}: ${res.status} ${res.statusText}`)
    return
  }

  const html = await res.text()
  console.log(`HTML received: ${html.length} chars`)

  // Save the HTML so we can study all the fishing info thoroughly
  fs.writeFileSync(path.join(OUTPUT_DIR, "page_content.html"), html, "utf-8")

  // Find all image URLs: <img ... src="..." >, data-src, srcset, or markdown/css urls
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  const imgUrls = new Set()
  let match

  while ((match = imgRegex.exec(html)) !== null) {
    imgUrls.add(match[1])
  }

  // Also check data-src, srcset, etc.
  const dataSrcRegex = /data-src=["']([^"']+)["']/gi
  while ((match = dataSrcRegex.exec(html)) !== null) {
    imgUrls.add(match[1])
  }

  // Also check background images or other assets
  const bgRegex = /url\(["']?([^"')]+)["']?\)/gi
  while ((match = bgRegex.exec(html)) !== null) {
    if (match[1].match(/\.(png|jpg|jpeg|webp|gif|svg)/i)) {
      imgUrls.add(match[1])
    }
  }

  console.log(`Found ${imgUrls.size} unique image candidates`)

  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const rawUrl of imgUrls) {
    try {
      let resolvedUrl = rawUrl
      if (rawUrl.startsWith("//")) {
        resolvedUrl = "https:" + rawUrl
      } else if (rawUrl.startsWith("/")) {
        resolvedUrl = "https://www.sfl.world" + rawUrl
      } else if (!rawUrl.startsWith("http")) {
        resolvedUrl = "https://www.sfl.world/info/fishing/" + rawUrl
      }

      // Determine clean filename
      const parsed = new URL(resolvedUrl)
      let filename = path.basename(parsed.pathname)
      // Decode URI components if URL encoded (like %20)
      filename = decodeURIComponent(filename)

      if (!filename || filename === "" || !filename.includes(".")) {
        filename = `img_${downloaded + 1}.png`
      }

      const filePath = path.join(OUTPUT_DIR, filename)

      console.log(`Downloading: ${resolvedUrl} -> ${filename}`)
      const imgRes = await fetch(resolvedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://www.sfl.world/info/fishing/info"
        }
      })

      if (!imgRes.ok) {
        console.warn(`Failed to download ${resolvedUrl}: ${imgRes.status}`)
        failed++
        continue
      }

      const arrayBuffer = await imgRes.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      fs.writeFileSync(filePath, buffer)
      downloaded++
    } catch (err) {
      console.error(`Error downloading ${rawUrl}:`, err.message)
      failed++
    }
  }

  console.log(`\nFinished! Downloaded: ${downloaded}, Failed: ${failed}`)
}

main().catch(console.error)

