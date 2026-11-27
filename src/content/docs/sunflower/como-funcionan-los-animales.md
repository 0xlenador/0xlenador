# 🐮 Cómo funcionan los Animales y Edificios en Sunflower Land

Documentación técnica y operativa sobre la cría de animales, gestión de edificios y recompensas en Sunflower Land.

---

## 🏗️ 1. Edificios de Animales

### Hen House (Gallinero)

- **Animales permitidos:** Gallinas (`Chicken`).
- **¿Qué se hace dentro?:** Alimentar con granos (`feed`), acariciar (`Petting Hand`), curar enfermedades con medicina, recolectar huevos/plumas y canjear gallinas maduras en el tablón semanal de pedidos (_Bounties_).
- **Mejoras y capacidades:**
  - **Nivel 1:** Capacidad de 10 gallinas · Desbloquea hasta 10 bounties/semana (6 tickets, 4 coins).
  - **Nivel 2:** Capacidad de 15 gallinas · Desbloquea hasta 15 bounties/semana (6 tickets, 9 coins).
  - **Nivel 3:** Capacidad de 20 gallinas · Desbloquea hasta 20 bounties/semana (6 tickets, 12 coins, 2 gemas).

### Barn (Establo)

- **Animales permitidos:** Vacas (`Cow`) y Ovejas (`Sheep`).
- **¿Qué se hace dentro?:** Alimentar con heno/slops, cepillar (`Brush`) para subir afecto, sanar con medicina de establo, ordeñar leche, esquilar lana y entregar animales maduros en los pedidos semanales.
- **Mejoras y capacidades:**
  - **Nivel 1:** Capacidad de 10 animales (combinados) · Desbloquea hasta 10 bounties/semana (6 tickets, 4 coins).
  - **Nivel 2:** Capacidad de 15 animales (combinados) · Desbloquea hasta 15 bounties/semana (6 tickets, 9 coins).
  - **Nivel 3:** Capacidad de 20 animales (combinados) · Desbloquea hasta 20 bounties/semana (6 tickets, 11 coins, 3 gemas).

### Pigpen (Pocilga)

- **Animales permitidos:** Cerdos (`Pig`).
- **¿Qué se hace dentro?:** Alimentar con mezclas de lodo/slops, relajar con música (`Music Box`), curar enfermedades, cosechar cerdas/pelos (_Bristles_), buscar trufas y canjear cerdos en los pedidos semanales.
- **Mejoras y capacidades:**
  - **Nivel 1:** Capacidad de 3 cerdos · Desbloquea hasta 3 bounties/semana (2 coins, 1 cerdas).
  - **Nivel 2:** Capacidad de 6 cerdos · Desbloquea hasta 7 bounties/semana (5 coins, 1 gemas, 1 cerdas).
  - **Nivel 3:** Capacidad de 9 cerdos · Desbloquea hasta 11 bounties/semana (7 coins, 3 gemas, 1 cerdas).

---

## 🥚 2. Producción de Recursos por Animal

Todos los animales tienen un **recurso primario** que incrementa su rendimiento según el nivel del animal, y un **recurso secundario** que se desbloquea al alcanzar un nivel específico:

| Animal                | Recurso Primario | Rendimiento por Cosecha                                                              | Recurso Secundario   | Desbloqueo y Escalado Secundario                                   |
| :-------------------- | :--------------- | :----------------------------------------------------------------------------------- | :------------------- | :----------------------------------------------------------------- |
| **Chicken (Gallina)** | 🥚 Egg           | **Lvl 1–3:** 1 · **Lvl 4–7:** 2 · **Lvl 8–12:** 3 · **Lvl 13–14:** 4 · **Lvl 15:** 5 | 🪶 Feather           | **Lvl 3–8:** 1 · **Lvl 9–14:** 2 · **Lvl 15:** 3                   |
| **Cow (Vaca)**        | 🥛 Milk          | **Lvl 1–3:** 1 · **Lvl 4–7:** 2 · **Lvl 8–14:** 3 · **Lvl 15:** 4                    | 🪵 Leather           | **Lvl 1–5:** 1 · **Lvl 6–9:** 2 · **Lvl 10–14:** 3 · **Lvl 15:** 4 |
| **Sheep (Oveja)**     | 🧶 Wool          | **Lvl 1–3:** 1 · **Lvl 4–7:** 2 · **Lvl 8–14:** 3 · **Lvl 15:** 4                    | 🧶 Merino Wool       | **Lvl 1–5:** 1 · **Lvl 6–9:** 2 · **Lvl 10–14:** 3 · **Lvl 15:** 4 |
| **Pig (Cerdo)**       | 🍄 Truffle       | **Lvl 1–3:** 1 · **Lvl 4–7:** 2 · **Lvl 8–14:** 3 · **Lvl 15:** 4                    | — _(Sin secundario)_ | —                                                                  |

---

## 📈 3. Curva Oficial de Experiencia (XP) por Nivel

El sistema oficial de Sunflower Land (`ANIMAL_LEVELS`) define que cada animal tiene su propia curva de progreso en proporciones exactas:

- **Chicken:** Base ($1\times$) → 2,720 XP total acumulado al Nivel 15.
- **Sheep:** Doble ($2\times$) → 5,440 XP total acumulado al Nivel 15.
- **Cow / Pig:** Triple ($3\times$) → 8,160 XP total acumulado al Nivel 15.

_(El valor indica la **XP acumulada total** para alcanzar ese nivel, y entre paréntesis el incremento de XP necesario en ese salto)_:

|   Nivel    | 🐔 Chicken ($1\times$) | 🐑 Sheep ($2\times$) | 🐮 Cow / 🐷 Pig ($3\times$) | Hitos y Desbloqueos                                                       |
| :--------: | :--------------------: | :------------------: | :-------------------------: | :------------------------------------------------------------------------ |
| **Lvl 1**  |      **60** (+60)      |    **120** (+120)    |       **180** (+180)        | Nivel inicial · 🪵 Leather y 🧶 Merino Wool disponibles desde Lvl 1       |
| **Lvl 2**  |     **120** (+60)      |    **240** (+120)    |       **360** (+180)        | —                                                                         |
| **Lvl 3**  |     **240** (+120)     |    **480** (+240)    |       **720** (+360)        | 🪶 Feather en gallinas · Pueden empezar a enfermarse                      |
| **Lvl 4**  |     **360** (+120)     |    **720** (+240)    |      **1,080** (+360)       | **Tier 2 primario:** 🥚 Egg, 🥛 Milk, 🧶 Wool y 🍄 Truffle rinden 2       |
| **Lvl 5**  |     **480** (+120)     |    **960** (+240)    |      **1,440** (+360)       | —                                                                         |
| **Lvl 6**  |     **660** (+180)     |   **1,320** (+360)   |      **1,980** (+540)       | 🪵 Leather y 🧶 Merino Wool rinden 2                                      |
| **Lvl 7**  |     **840** (+180)     |   **1,680** (+360)   |      **2,520** (+540)       | —                                                                         |
| **Lvl 8**  |    **1,020** (+180)    |   **2,040** (+360)   |      **3,060** (+540)       | **Tier 3 primario:** 🥚 Egg, 🥛 Milk, 🧶 Wool y 🍄 Truffle rinden 3       |
| **Lvl 9**  |    **1,200** (+180)    |   **2,400** (+360)   |      **3,600** (+540)       | 🪶 Feather en gallinas rinde 2                                            |
| **Lvl 10** |    **1,440** (+240)    |   **2,880** (+480)   |      **4,320** (+720)       | 🪵 Leather y 🧶 Merino Wool rinden 3                                      |
| **Lvl 11** |    **1,680** (+240)    |   **3,360** (+480)   |      **5,040** (+720)       | —                                                                         |
| **Lvl 12** |    **1,920** (+240)    |   **3,840** (+480)   |      **5,760** (+720)       | —                                                                         |
| **Lvl 13** |    **2,160** (+240)    |   **4,320** (+480)   |      **6,480** (+720)       | 🥚 Egg en gallinas rinde 4                                                |
| **Lvl 14** |    **2,400** (+240)    |   **4,800** (+480)   |      **7,200** (+720)       | Salto al nivel máximo                                                     |
| **Lvl 15** |    **2,720** (+320)    |   **5,440** (+640)   |      **8,160** (+960)       | **Nivel Máximo (Cap):** 🥚 Egg (5), 🪶 Feather (3), resto de recursos (4) |

---

## 📁 4. Fuentes de Datos del Proyecto (SSOT)

- **Edificios y mejoras:** `src/content/data/sfl/animals/buildings.json`
- **Definición de animales y XP:** `src/content/data/sfl/animals/animals.json`
- **Alimentos y medicinas:** `src/content/data/sfl/animals/consumables.json`
- **Tipos y utilidades TypeScript:** `src/lib/sfl/animals.ts`
