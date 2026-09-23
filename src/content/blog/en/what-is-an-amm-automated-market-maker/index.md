---
title: "What is an AMM (Automated Market Maker)?"
description: "Discover what an AMM (Automated Market Maker) is, how liquidity pools work, and why they are fundamental to the DeFi ecosystem and decentralized exchanges."
category: "DeFi"
date: 2026-09-23
author: "0x Leñador"
translationSlug: "que-es-un-amm-automated-market-maker"
coverImage: "../../es/que-es-un-amm-automated-market-maker/amm.webp"
coverAlt: "What is an AMM (Automated Market Maker)?"
faq:
  - pregunta: "What are the most popular AMMs?"
    respuesta: "Some of the most well-known Automated Market Makers in the DeFi ecosystem are Uniswap, Curve (optimized for stablecoins), Balancer (which allows customizable pools), and PancakeSwap."
  - pregunta: "What is slippage?"
    respuesta: "Slippage is the difference between the expected price of a trade and the price at which it actually executes. In AMMs, pools with lower liquidity tend to generate higher slippage for large trades."
  - pregunta: "What is impermanent loss?"
    respuesta: "It is a risk for liquidity providers that occurs when the price of the deposited tokens changes compared to the time of deposit. If you withdraw your funds when this price difference is large, the loss becomes permanent."
---

An **Automated Market Maker (AMM)** is a protocol that allows the exchange of digital assets **without intermediaries, without order books, and without the need for counterparties**. At its core, it is an algorithm that **prices automatically** using mathematical formulas and liquidity pools provided by users.

Unlike traditional markets (where prices are determined by buyers and sellers), an AMM operates under pre-programmed rules: **decentralized liquidity, prices determined by equations, and instant execution**.

## Introduction

Before AMMs, trading digital assets required:

- **Centralized order books** (like in stock exchanges).
- **Human market makers** who manually adjusted prices.
- **Fragmented liquidity** (depending on momentary supply/demand).

AMMs eliminated these problems by replacing the traditional system with:
✅ **Smart contracts** that act as clearinghouses.
✅ **Mathematical formulas** that calculate prices in real-time.
✅ **Economic incentives** for users to provide liquidity.

## What is an AMM?

An AMM is a type of automated exchange protocol that:

- **Does not rely on buy/sell orders**.
- **Uses liquidity pools** (funds provided by users).
- **Applies a mathematical formula** to determine prices (e.g., `x * y = k`).

**Practical example**:
If a pool has **100 ETH** and **200,000 USDT**, the formula `x * y = k` ensures that the product (k) is always **20,000,000**. If someone buys 1 ETH, the pool automatically recalculates the price to keep `k` constant.

## How does an AMM work?

AMMs follow a model based on **liquidity pools** and predefined algorithms. Here we explain the step-by-step process:

1. **Liquidity Pools**
   - Users (liquidity providers) deposit token pairs (e.g., ETH/USDT) into a smart contract.
   - In return, they receive **LP (Liquidity Provider) tokens**, which represent their share in the pool.
2. **Pricing Formula**
   - Most AMMs use the formula **x * y = k** (as seen in Uniswap), where:
     - **x** = Amount of Token A
     - **y** = Amount of Token B
     - **k** = Constant that maintains pool equilibrium.
   - The price adjusts automatically based on supply and demand.
3. **Swaps**
   - When a user wants to exchange Token A for Token B, the smart contract recalculates the price based on available liquidity.
   - The higher the liquidity, the lower the slippage.
4. **Fees and Rewards**
   - Traders pay a small fee (e.g., 0.3% on Uniswap).
   - Liquidity providers earn a portion of these fees proportional to their contribution.

## Key Features of AMMs

✅ **Decentralization**: They don't require intermediaries; everything executes on the blockchain.
✅ **Accessibility**: Anyone can provide liquidity and earn rewards.
✅ **Transparency**: Prices and transactions are public and verifiable.
✅ **Constant Innovation**: New models like **Curve (for stablecoins)** or **Balancer (customizable pools)** improve efficiency.

## Conclusion

**AMMs have revolutionized decentralized trading**, eliminating the need for limit orders and allowing anyone to participate as a liquidity provider. However, they also present risks, such as **impermanent loss** or a dependence on available liquidity.
