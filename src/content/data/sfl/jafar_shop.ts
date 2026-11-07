export interface Ingredient {
  name: string
  amount: number
  image: string
}

export interface JafarBuyItem {
  id: string
  name: string
  description: string
  coins: number
  stock?: number
  isPermanent?: boolean
  image: string
  ingredients?: Ingredient[]
}

export interface JafarSellItem {
  id: string
  name: string
  description: string
  coins: number
  image: string
  seasonal?: boolean
}

export interface JafarCategory<T = JafarBuyItem | JafarSellItem> {
  id: string
  name: string
  items: T[]
}

export interface JafarTab {
  id: "buy" | "sell"
  name: string
  categories: JafarCategory<any>[]
}

export interface JafarData {
  npc: {
    id: string
    name: string
    icon: string
    tabs: [
      {
        id: "buy"
        name: "Buy"
        categories: JafarCategory<JafarBuyItem>[]
      },
      {
        id: "sell"
        name: "Sell"
        categories: JafarCategory<JafarSellItem>[]
      }
    ]
  }
}

export const jafarData: JafarData = {
  npc: {
    id: "jafar",
    name: "Jafar",
    icon: "/img/sunflowerland/NPCs/jafar.webp",
    tabs: [
      {
        id: "buy",
        name: "Buy",
        categories: [
          {
            id: "tools",
            name: "Tools",
            items: [
              {
                id: "sand_shovel",
                name: "Sand Shovel",
                description: "Used for digging treasure",
                coins: 20,
                stock: 125,
                image: "/img/sunflowerland/tools/sand_shovel.png",
                ingredients: [
                  { name: "Wood", amount: 2, image: "/img/sunflowerland/Wood.png" },
                  { name: "Stone", amount: 1, image: "/img/sunflowerland/Stone.png" }
                ]
              },
              {
                id: "sand_drill",
                name: "Sand Drill",
                description: "Used for digging 2x2 treasure areas",
                coins: 40,
                stock: 25,
                image: "/img/sunflowerland/tools/sand_drill.png",
                ingredients: [
                  { name: "Oil", amount: 1, image: "/img/sunflowerland/123/Oil.png" },
                  { name: "Crimstone", amount: 1, image: "/img/sunflowerland/Crimstone.png" },
                  { name: "Wood", amount: 3, image: "/img/sunflowerland/Wood.png" },
                  { name: "Leather", amount: 1, image: "/img/sunflowerland/Leather.png" }
                ]
              }
            ]
          },
          {
            id: "collectibles",
            name: "Collectibles",
            items: [
              {
                id: "treasure_map",
                name: "Treasure Map",
                description: "A mysterious map indicating buried treasures",
                coins: 0,
                stock: 1,
                isPermanent: true,
                image: "/img/sunflowerland/collectible/treasure_map.webp",
                ingredients: [
                  { name: "Sand", amount: 50, image: "/img/sunflowerland/treasure/sand.png" },
                  { name: "Hieroglyph", amount: 20, image: "/img/sunflowerland/treasure/hieroglyph.png" }
                ]
              },
              {
                id: "adrift_ark",
                name: "Adrift Ark",
                description: "A rare shiny chicken found in desert sands",
                coins: 0,
                image: "/img/sunflowerland/collectible/adrift_ark.webp",
                ingredients: [
                  { name: "Sand", amount: 125, image: "/img/sunflowerland/treasure/sand.png" }
                ]
              },
              {
                id: "castellan",
                name: "Castellan",
                description: "An ancient regal companion from desert ruins",
                coins: 0,
                image: "/img/sunflowerland/collectible/castellan.webp",
                ingredients: [
                  { name: "Sand", amount: 750, image: "/img/sunflowerland/treasure/sand.png" }
                ]
              }
            ]
          },
          {
            id: "wearables",
            name: "Wearables",
            items: [
              {
                id: "bionic_drill",
                name: "Bionic Drill",
                description: "Protective eyewear against desert sandstorms",
                coins: 0,
                stock: 1,
                isPermanent: true,
                image: "/img/sunflowerland/wearables/bionic_drill.webp",
                ingredients: [
                  { name: "Sand", amount: 300, image: "/img/sunflowerland/treasure/sand.png" },
                  { name: "Hieroglyph", amount: 50, image: "/img/sunflowerland/treasure/hieroglyph.png" }
                ]
              }
            ]
          },
          {
            id: "keys",
            name: "Keys",
            items: [
              {
                id: "treasure_key",
                name: "Treasure Key",
                description: "Used to open standard treasure chests",
                coins: 0,
                image: "/img/sunflowerland/123/Treasure Key.png",
                ingredients: [
                  { name: "Sand", amount: 10, image: "/img/sunflowerland/treasure/sand.png" },
                  { name: "Hieroglyph", amount: 3, image: "/img/sunflowerland/treasure/hieroglyph.png" }
                ]
              },
              {
                id: "rare_key",
                name: "Rare Key",
                description: "Used to unlock rare desert chest vaults",
                coins: 0,
                image: "/img/sunflowerland/123/key_rare.png",
                ingredients: [
                  { name: "Sand", amount: 30, image: "/img/sunflowerland/treasure/sand.png" },
                  { name: "Hieroglyph", amount: 10, image: "/img/sunflowerland/treasure/hieroglyph.png" }
                ]
              },
              {
                id: "luxury_key",
                name: "Luxury Key",
                description: "An ornate key for ancient opulent treasure chests",
                coins: 0,
                image: "/img/sunflowerland/123/key_luxury.png",
                ingredients: [
                  { name: "Sand", amount: 100, image: "/img/sunflowerland/treasure/sand.png" },
                  { name: "Hieroglyph", amount: 30, image: "/img/sunflowerland/treasure/hieroglyph.png" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "sell",
        name: "Sell",
        categories: [
          {
            id: "treasures",
            name: "Treasures",
            items: [
              {
                id: "sand",
                name: "Sand",
                description: "It gets everywhere",
                coins: 10,
                image: "/img/sunflowerland/treasure/sand.png"
              },
              {
                id: "camel_bone",
                name: "Camel Bone",
                description: "An ancient desert bone",
                coins: 10,
                image: "/img/sunflowerland/treasure/camel_bone.png"
              },
              {
                id: "crab",
                name: "Crab",
                description: "A tiny beach crab",
                coins: 15,
                image: "/img/sunflowerland/treasure/crab.png"
              },
              {
                id: "old_bottle",
                name: "Old Bottle",
                description: "An antique bottle washed ashore",
                coins: 22.5,
                image: "/img/sunflowerland/treasure/old_bottle.png"
              },
              {
                id: "sea_cucumber",
                name: "Sea Cucumber",
                description: "A squishy marine creature",
                coins: 22.5,
                image: "/img/sunflowerland/treasure/sea_cucumber.png"
              },
              {
                id: "amphora",
                name: "Amphora",
                description: "An ancient clay vase from buried ruins",
                coins: 62.5,
                image: "/img/sunflowerland/treasure/amphora.png"
              },
              {
                id: "seaweed",
                name: "Seaweed",
                description: "Ocean flora gathered from the sands",
                coins: 75,
                image: "/img/sunflowerland/treasure/seaweed.png"
              },
              {
                id: "cockle_shell",
                name: "Cockle Shell",
                description: "A delicate shell found on tidal flats",
                coins: 125,
                image: "/img/sunflowerland/treasure/cockle_shell.png"
              },
              {
                id: "starfish",
                name: "Starfish",
                description: "A bright orange sea star",
                coins: 112.5,
                image: "/img/sunflowerland/treasure/starfish.png"
              },
              {
                id: "wooden_compass",
                name: "Wooden Compass",
                description: "A seasoned wooden compass for seafaring",
                coins: 131.67,
                image: "/img/sunflowerland/treasure/wooden_compass.png"
              },
              {
                id: "iron_compass",
                name: "Iron Compass",
                description: "A sturdy iron-rimmed navigational tool",
                coins: 234.17,
                image: "/img/sunflowerland/treasure/iron_compass.png"
              },
              {
                id: "emerald_compass",
                name: "Emerald Compass",
                description: "An ornate compass set with polished emerald",
                coins: 156.67,
                image: "/img/sunflowerland/treasure/emerald_compass.png"
              },
              {
                id: "clam_shell",
                name: "Clam Shell",
                description: "A sturdy clam shell from the depths",
                coins: 375,
                image: "/img/sunflowerland/treasure/clam_shell.png"
              },
              {
                id: "clover_coin",
                name: "Clover Coin",
                description: "A lucky token from desert caves",
                coins: 25,
                image: "/img/sunflowerland/treasure/clover_coin.png",
                seasonal: true
              },
              {
                id: "hieroglyph",
                name: "Hieroglyph",
                description: "An ancient tablet etched with desert inscriptions",
                coins: 250,
                image: "/img/sunflowerland/treasure/hieroglyph.png"
              },
              {
                id: "pipi",
                name: "Pipi",
                description: "An edible beach clam found on the shore",
                coins: 250,
                image: "/img/sunflowerland/treasure/pipi.png"
              },
              {
                id: "coral",
                name: "Coral",
                description: "A vibrant cluster of sea reef coral",
                coins: 1500,
                image: "/img/sunflowerland/treasure/coral.png"
              },
              {
                id: "pearl",
                name: "Pearl",
                description: "A lustrous natural ocean pearl",
                coins: 3750,
                image: "/img/sunflowerland/treasure/pearl.png"
              },
              {
                id: "pirate_bounty",
                name: "Pirate Bounty",
                description: "A legendary chest of pirate gold and treasure",
                coins: 9375,
                image: "/img/sunflowerland/treasure/pirate_bounty.png"
              }
            ]
          }
        ]
      }
    ]
  }
}

export default jafarData

