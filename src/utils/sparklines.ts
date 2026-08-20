export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === undefined || num === null || num === 0) return "0"
  if (num < 0.0001) return num.toExponential(2)
  let dynamicDecimals = decimals
  if (num >= 1000) dynamicDecimals = 0
  else if (num >= 1) dynamicDecimals = Math.min(2, decimals)

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: dynamicDecimals,
  }).format(num)
}

export const createSparklineSVG = (
  dataArray: (number | null | undefined)[],
  isPositive: boolean,
  expectedLengthParam?: number,
  isHourly: boolean = false,
  formatType?: string
): string => {
  if (!dataArray) return ""
  const validData = dataArray.filter((v): v is number => v !== null && v !== undefined)
  if (validData.length < 2) return ""

  const expectedLength = expectedLengthParam || validData.length
  const width = 100
  const height = 30
  const max = Math.max(...validData)
  const min = Math.min(...validData)
  const range = max - min || 1

  const getX = (i: number) => {
    const daysAgo = validData.length - 1 - i
    const xProgress = 1 - (daysAgo / Math.max(1, expectedLength - 1))
    return xProgress * width
  }
  const getY = (val: number) => height - ((val - min) / range) * height

  const pointsArray = validData.map((val, i) => [getX(i), getY(val)])

  const getCurve = (pts: number[][]) => {
    if (pts.length === 2) return `L ${pts[1][0]},${pts[1][1]}`
    let d = ""
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2 === pts.length ? i + 1 : i + 2]
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
    }
    return d
  }

  const strokePath = `M ${pointsArray[0][0]},${pointsArray[0][1]} ${getCurve(pointsArray)}`
  const fillPath = `${strokePath} L ${width},${height} L ${pointsArray[0][0]},${height} Z`

  const maxIndex = validData.indexOf(max)
  const minIndex = validData.indexOf(min)
  const finalIndex = validData.length - 1

  const strokeColor = isPositive ? "#10b981" : "#ef4444"
  const dotColor = "#f59e0b"

  return `
    <div class="relative w-full h-full sparkline-container cursor-crosshair group/spark" 
         data-points='${JSON.stringify(validData)}' 
         data-min="${min}" 
         data-range="${range}"
         data-expected-length="${expectedLength}"
         data-format="${formatType || ''}"
         data-is-hourly="${isHourly ? 'true' : 'false'}">
      <svg width="100%" height="100%" viewBox="0 -2 100 34" preserveAspectRatio="none" class="opacity-70 group-hover/spark:opacity-100 transition-opacity drop-shadow-md relative z-0 overflow-visible">
        <path d="${fillPath}" fill="${strokeColor}" fill-opacity="0.6" style="-webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%); mask-image: linear-gradient(to bottom, black 0%, transparent 100%);" stroke="none" />
        <path d="${strokePath}" fill="none" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
        
        <circle cx="${getX(maxIndex)}" cy="${getY(max)}" r="0.6" fill="${dotColor}" />
        <circle cx="${getX(minIndex)}" cy="${getY(min)}" r="0.6" fill="${dotColor}" />
        <circle cx="${getX(finalIndex)}" cy="${getY(validData[finalIndex])}" r="0.6" fill="${dotColor}" />
        
        <line class="hover-line hidden pointer-events-none" y1="-2" y2="34" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
        <circle class="hover-dot hidden pointer-events-none" r="2" fill="${strokeColor}" stroke="#1e1e1e" stroke-width="1" />
      </svg>
      
      <div class="hover-tooltip hidden absolute border border-white/10 px-3 py-2.5 rounded-xl pointer-events-none z-[100] whitespace-nowrap transition-none" 
           style="background-color: #0c1015; box-shadow: 0 8px 30px rgba(0,0,0,0.8); transform: translateX(-50%) translateY(-100%); margin-top: -8px;">
      </div>
    </div>
  `
}

export const initSparklineHover = () => {
  // Prevent multiple initializations
  if (typeof window === "undefined" || (window as any).__sparklineHoverInitialized) return;
  (window as any).__sparklineHoverInitialized = true;

  let activeSparkline: HTMLElement | null = null;
  
  const hideSparklineElements = (container: HTMLElement) => {
    if (!container) return
    const line = container.querySelector(".hover-line")
    const dot = container.querySelector(".hover-dot")
    const tooltip = container.querySelector(".hover-tooltip")
    if (line) line.classList.add("hidden")
    if (dot) dot.classList.add("hidden")
    if (tooltip) tooltip.classList.add("hidden")
  }

  document.addEventListener("mousemove", (e) => {
    const target = e.target as HTMLElement
    const container = target.closest(".sparkline-container") as HTMLElement | null

    if (container !== activeSparkline) {
      if (activeSparkline) hideSparklineElements(activeSparkline)
      activeSparkline = container
    }

    if (!container) return

    const rect = container.getBoundingClientRect()
    const xPos = e.clientX - rect.left
    const width = rect.width

    const dataPoints = JSON.parse(container.dataset.points || "[]") as number[]
    const numPoints = dataPoints.length
    const expectedLength = parseInt(container.dataset.expectedLength || "0") || numPoints
    
    const isHourly = container.dataset.isHourly === "true"; 

    const pointsAgoHovered = Math.round((1 - (xPos / width)) * Math.max(1, expectedLength - 1))
    let index = numPoints - 1 - pointsAgoHovered

    const line = container.querySelector(".hover-line")
    const dot = container.querySelector(".hover-dot")
    const tooltip = container.querySelector(".hover-tooltip") as HTMLElement

    if (index < 0 || index >= numPoints) {
      if (line) line.classList.add("hidden")
      if (dot) dot.classList.add("hidden")
      if (tooltip) tooltip.classList.add("hidden")
      return
    }

    const val = dataPoints[index]
    const min = parseFloat(container.dataset.min || "0")
    const range = parseFloat(container.dataset.range || "1")

    const svgWidth = 100
    const svgHeight = 30
    
    const pointsAgo = numPoints - 1 - index
    const xProgress = 1 - (pointsAgo / Math.max(1, expectedLength - 1))
    const mappedX = xProgress * svgWidth
    const mappedY = svgHeight - ((val - min) / range) * svgHeight

    if (line && dot && tooltip) {
      line.classList.remove("hidden")
      line.setAttribute("x1", mappedX.toString())
      line.setAttribute("x2", mappedX.toString())

      dot.classList.remove("hidden")
      dot.setAttribute("cx", mappedX.toString())
      dot.setAttribute("cy", mappedY.toString())

      tooltip.classList.remove("hidden")
      
      const initialPrice = dataPoints[0]
      const formatType = container.dataset.format || ""
      
      let displayLabel = "Price:"
      let displayValStr = formatNumber(val, 4)
      let subtextHTML = ""
      
      if (formatType === "usd-large-sfl") {
         displayLabel = "Market Cap:"
         const sflUsdPrice = (window as any).sflUsdPrice || 0
         const valUsd = val * sflUsdPrice
         const formatLarge = (num: number) => {
           if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'
           if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
           if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
           if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
           return num.toFixed(2)
         }
         displayValStr = `$ ${formatLarge(valUsd)}`
         subtextHTML = `<div class="text-[9px] text-white/40 font-mono tracking-tight mt-1">${formatLarge(val)} FLOWER</div>`
      }

      let pctHTML = ""

      const d = new Date()
      if (isHourly) {
        d.setHours(d.getHours() - pointsAgo)
      } else {
        d.setDate(d.getDate() - pointsAgo)
      }
      
      const isEn = window.location.pathname.includes('/en/')
      const dateOptions: Intl.DateTimeFormatOptions = isHourly 
        ? { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { month: 'short', day: 'numeric', year: 'numeric' }
      const dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'es-ES', dateOptions)

      tooltip.innerHTML = `
        <div class="flex flex-col gap-1.5 text-[10.5px] font-sans text-left leading-none">
           <div class="flex items-center gap-1.5"><span class="text-white/50">Date:</span> <span class="text-white font-semibold tracking-wide">${dateStr}</span></div>
           <div class="flex items-center"><span class="text-white/50 mr-1.5">${displayLabel}</span> <span class="text-white font-bold tracking-wide">${displayValStr}</span>${pctHTML}</div>
           ${subtextHTML}
        </div>
      `

      // Prevent tooltip from overflowing edges
      let tooltipX = (mappedX / svgWidth) * 100;
      let transformStr = "translateX(-50%) translateY(-100%)";
      
      if (tooltipX < 15) {
         transformStr = "translateX(0%) translateY(-100%)";
      } else if (tooltipX > 85) {
         transformStr = "translateX(-100%) translateY(-100%)";
      }

      tooltip.style.left = `${tooltipX}%`
      tooltip.style.top = `${(mappedY / svgHeight) * 100}%`
      tooltip.style.transform = transformStr;
    }
  })
}
