export interface BeetleOdd {
  id: string
  name: string
  sflId: number
  image: string
  chance: number // e.g. 0.40 = 40%
}

export interface CaveIngredientOption {
  name: string
  sflId: number
  amount: number
  image: string
}

export interface CaveRequirement {
  name: string
  amount: number
  image: string
  options?: CaveIngredientOption[]
}

export interface CaveMixRewards {
  mushrooms: number
  beetles: number
  mud: number
  mudBoosted?: number
}

export interface CaveMix {
  id: string
  name: string
  description: string
  durationHours: number
  requirement: CaveRequirement
  rewards: CaveMixRewards
  beetleOdds: BeetleOdd[]
  image: string
}

export interface CaveData {
  id: string
  name: string
  shovelsPerBatch: number
  gridSize: {
    rows: number
    cols: number
    totalCells: number
  }
  toolRequired: {
    id: string
    name: string
    image: string
  }
  mixes: CaveMix[]
}

export const caveData: CaveData = {
  id: "compost_cave",
  name: "Cave Composter",
  shovelsPerBatch: 25,
  gridSize: {
    rows: 5,
    cols: 5,
    totalCells: 25
  },
  toolRequired: {
    id: "sand_shovel",
    name: "Sand Shovel",
    image: "/img/sunflowerland/tools/sand_shovel.png"
  },
  mixes: [
    {
      id: "mushroom_mix",
      name: "Mushroom Mix",
      description: "The most Wild Mushrooms of any mix.",
      durationHours: 12,
      requirement: {
        name: "Wood",
        amount: 10,
        image: "/img/sunflowerland/Wood.png"
      },
      rewards: {
        mushrooms: 6,
        beetles: 2,
        mud: 17
      },
      beetleOdds: [
        {
          id: "green_beetle",
          name: "Green Beetle",
          sflId: 3084,
          image: "/img/sunflowerland/green_beetle.webp",
          chance: 0.4
        },
        {
          id: "blue_beetle",
          name: "Blue Beetle",
          sflId: 3085,
          image: "/img/sunflowerland/blue_beetle.webp",
          chance: 0.3
        },
        {
          id: "pink_beetle",
          name: "Pink Beetle",
          sflId: 3086,
          image: "/img/sunflowerland/pink_beetle.webp",
          chance: 0.2
        },
        {
          id: "amber_beetle",
          name: "Amber Beetle",
          sflId: 3087,
          image: "/img/sunflowerland/amber_beetle.webp",
          chance: 0.1
        }
      ],
      image: "/img/sunflowerland/123/wild_mushroom.webp"
    },
    {
      id: "beetle_mix",
      name: "Beetle Mix",
      description: "High concentration of rare beetles.",
      durationHours: 12,
      requirement: {
        name: "Egg",
        amount: 30,
        image: "/img/sunflowerland/Egg.png"
      },
      rewards: {
        mushrooms: 3,
        beetles: 5,
        mud: 17
      },
      beetleOdds: [
        {
          id: "green_beetle",
          name: "Green Beetle",
          sflId: 3084,
          image: "/img/sunflowerland/green_beetle.webp",
          chance: 0.4
        },
        {
          id: "blue_beetle",
          name: "Blue Beetle",
          sflId: 3085,
          image: "/img/sunflowerland/blue_beetle.webp",
          chance: 0.3
        },
        {
          id: "pink_beetle",
          name: "Pink Beetle",
          sflId: 3086,
          image: "/img/sunflowerland/pink_beetle.webp",
          chance: 0.2
        },
        {
          id: "amber_beetle",
          name: "Amber Beetle",
          sflId: 3087,
          image: "/img/sunflowerland/amber_beetle.webp",
          chance: 0.1
        }
      ],
      image: "/img/sunflowerland/green_beetle.webp"
    },
    {
      id: "mud_mix",
      name: "Mud Mix",
      description: "Dense mud concentration with rich compost organic matter.",
      durationHours: 12,
      requirement: {
        name: "Sunflower",
        amount: 500,
        image: "/img/sunflowerland/Sunflower.png",
        options: [
          { name: "Sunflower", sflId: 201, amount: 500, image: "/img/sunflowerland/Sunflower.png" },
          { name: "Potato", sflId: 202, amount: 80, image: "/img/sunflowerland/Potato.png" },
          { name: "Pumpkin", sflId: 203, amount: 20, image: "/img/sunflowerland/Pumpkin.png" },
          { name: "Carrot", sflId: 204, amount: 10, image: "/img/sunflowerland/Carrot.png" },
          { name: "Cabbage", sflId: 205, amount: 5, image: "/img/sunflowerland/Cabbage.png" },
          { name: "Beetroot", sflId: 206, amount: 3, image: "/img/sunflowerland/Beetroot.png" },
          { name: "Cauliflower", sflId: 207, amount: 2, image: "/img/sunflowerland/Cauliflower.png" },
          { name: "Parsnip", sflId: 208, amount: 2, image: "/img/sunflowerland/Parsnip.png" },
          { name: "Radish", sflId: 209, amount: 2, image: "/img/sunflowerland/Radish.png" },
          { name: "Wheat", sflId: 210, amount: 2, image: "/img/sunflowerland/Wheat.png" },
          { name: "Kale", sflId: 211, amount: 2, image: "/img/sunflowerland/Kale.png" },
          { name: "Eggplant", sflId: 215, amount: 2, image: "/img/sunflowerland/Eggplant.png" },
          { name: "Corn", sflId: 216, amount: 2, image: "/img/sunflowerland/Corn.png" },
          { name: "Soybean", sflId: 251, amount: 3, image: "/img/sunflowerland/Soybean.png" },
          { name: "Rice", sflId: 253, amount: 1, image: "/img/sunflowerland/Rice.png" },
          { name: "Olive", sflId: 254, amount: 1, image: "/img/sunflowerland/Olive.png" },
          { name: "Barley", sflId: 257, amount: 2, image: "/img/sunflowerland/Barley.png" },
          { name: "Rhubarb", sflId: 258, amount: 40, image: "/img/sunflowerland/Rhubarb.png" },
          { name: "Zucchini", sflId: 259, amount: 20, image: "/img/sunflowerland/Zucchini.png" },
          { name: "Yam", sflId: 260, amount: 10, image: "/img/sunflowerland/Yam.png" },
          { name: "Broccoli", sflId: 261, amount: 5, image: "/img/sunflowerland/Broccoli.png" },
          { name: "Pepper", sflId: 262, amount: 3, image: "/img/sunflowerland/Pepper.png" },
          { name: "Onion", sflId: 263, amount: 2, image: "/img/sunflowerland/Onion.png" },
          { name: "Turnip", sflId: 264, amount: 2, image: "/img/sunflowerland/Turnip.png" },
          { name: "Artichoke", sflId: 265, amount: 2, image: "/img/sunflowerland/Artichoke.png" }
        ]
      },
      rewards: {
        mushrooms: 3,
        beetles: 2,
        mud: 20,
        mudBoosted: 40
      },
      beetleOdds: [
        {
          id: "green_beetle",
          name: "Green Beetle",
          sflId: 3084,
          image: "/img/sunflowerland/green_beetle.webp",
          chance: 0.4
        },
        {
          id: "blue_beetle",
          name: "Blue Beetle",
          sflId: 3085,
          image: "/img/sunflowerland/blue_beetle.webp",
          chance: 0.3
        },
        {
          id: "pink_beetle",
          name: "Pink Beetle",
          sflId: 3086,
          image: "/img/sunflowerland/pink_beetle.webp",
          chance: 0.2
        },
        {
          id: "amber_beetle",
          name: "Amber Beetle",
          sflId: 3087,
          image: "/img/sunflowerland/amber_beetle.webp",
          chance: 0.1
        }
      ],
      image: "/img/sunflowerland/123/mud.webp"
    }
  ]
}

export default caveData

