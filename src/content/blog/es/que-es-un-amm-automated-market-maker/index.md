---
layout: post
title: "¿Qué es un AMM (Automated Market Maker)?"
description: "Descubre qué es un AMM (Automated Market Maker), cómo funcionan los pools de liquidez y por qué son fundamentales para el ecosistema DeFi y los exchanges descentralizados."
category: "DeFi"
date: 2026-09-23
author: "0x Leñador"
translationSlug: "que-es-un-amm-automated-market-maker"
coverImage: "./amm.webp"
coverAlt: "¿Qué es un AMM (Automated Market Maker)?"
faq:
  - pregunta: "¿Cuáles son los AMM más populares?"
    respuesta: "Algunos de los Automated Market Makers más conocidos en el ecosistema DeFi son Uniswap, Curve (optimizado para stablecoins), Balancer (que permite pools personalizables) y PancakeSwap."
  - pregunta: "¿Qué es el slippage o deslizamiento de precio?"
    respuesta: "El slippage es la diferencia entre el precio esperado de un intercambio y el precio al que realmente se ejecuta. En los AMM, los pools con menor liquidez suelen generar un mayor slippage para operaciones grandes."
  - pregunta: "¿Qué es la pérdida impermanente (Impermanent Loss)?"
    respuesta: "Es un riesgo para los proveedores de liquidez que ocurre cuando el precio de los tokens depositados cambia en comparación con el momento del depósito. Si retiras tus fondos cuando esta diferencia de precio es grande, la pérdida se hace permanente."
---

Un **Automated Market Maker (AMM)** es un protocolo que permite el intercambio de activos digitales **sin intermediarios, sin libros de órdenes y sin necesidad de contrapartes**. En su esencia, es un algoritmo que **fija precios automáticamente** usando fórmulas matemáticas y pools de liquidez aportados por usuarios.

A diferencia de los mercados tradicionales (donde los precios los determinan compradores y vendedores), un AMM opera bajo reglas preprogramadas: **liquidez descentralizada, precios determinados por ecuaciones y ejecución instantánea**.

## Introducción

Antes de los AMM, intercambiar activos digitales requería:

- **Libros de órdenes centralizados** (como en bolsas de valores).
- **Market makers humanos** que ajustaban precios manualmente.
- **Liquidez fragmentada** (dependiendo de la oferta/demanda momentánea).

Los AMM eliminaron estos problemas reemplazando el sistema tradicional con:  
✅ **Contratos inteligentes** que actúan como cámaras de compensación.  
✅ **Fórmulas matemáticas** que calculan precios en tiempo real.  
✅ **Incentivos económicos** para que los usuarios provean liquidez.

## ¿Qué es un AMM?

Un AMM es un tipo de protocolo de intercambio automatizado que:

- **No depende de órdenes de compra/venta**.
- **Usa pools de liquidez** (fondos aportados por usuarios).
- **Aplica una fórmula matemática** para determinar precios (ej: `x * y = k`).

**Ejemplo práctico**:  
Si un pool tiene **100 ETH** y **200,000 USDT**, la fórmula `x * y = k` asegura que el producto (k) siempre sea **20,000,000**. Si alguien compra 1 ETH, el pool recalcula el precio automáticamente para mantener `k` constante.

## ¿Cómo funciona un AMM?

Los AMM siguen un modelo basado en **pools de liquidez** y algoritmos predefinidos. Aquí te explicamos el proceso paso a paso:

1. **Liquidity Pools (Pools de Liquidez)**
   - Los usuarios (proveedores de liquidez) depositan pares de tokens (ejemplo: ETH/USDT) en un contrato inteligente.
   - A cambio, reciben **tokens LP (Liquidity Provider)**, que representan su participación en el pool.
2. **Fórmula de fijación de precios**
   - La mayoría de AMM usan la fórmula **x \* y = k** (como en Uniswap), donde:
     - **x** = Cantidad del Token A
     - **y** = Cantidad del Token B
     - **k** = Constante que mantiene el equilibrio del pool.
   - El precio se ajusta automáticamente según la oferta y demanda.
3. **Intercambios (Swaps)**
   - Cuando un usuario quiere cambiar Token A por Token B, el smart contract recalcula el precio basado en la liquidez disponible.
   - A mayor liquidez, menor slippage (deslizamiento de precio).
4. **Tarifas y recompensas**
   - Los traders pagan una pequeña comisión (ej: 0.3% en Uniswap).
   - Los proveedores de liquidez ganan una parte de estas tarifas proporcional a su aporte.

## Características clave de los AMM

✅ **Descentralización**: No requieren intermediarios, todo se ejecuta en blockchain.  
✅ **Accesibilidad**: Cualquiera puede aportar liquidez y ganar recompensas.  
✅ **Transparencia**: Los precios y las transacciones son públicos y verificables.  
✅ **Innovación constante**: Nuevos modelos como **Curve (para stablecoins)** o **Balancer (pools personalizables)** mejoran la eficiencia.

## Conclusión

Los **AMM han revolucionado el trading descentralizado**, eliminando la necesidad de órdenes limitadas y permitiendo que cualquiera participe como proveedor de liquidez. Sin embargo, también presentan riesgos, como la **pérdida impermanente** o la dependencia de la liquidez disponible.
