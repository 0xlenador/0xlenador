export interface BeetleOdd {
  id: string
  name: string
  sflId: number
  image: string
  chance: number // e.g. 0.40 = 40%
}

export interface CaveMixRequirements {
  wood?: number
  iron?: number
  stone?: number
}

export interface CaveMixRewards {
  mushrooms: number
  beetles: number
  mud: number
}

export interface CaveMix {
  id: string
  name: string
  description: string
  durationHours: number
  requirements: CaveMixRequirements
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
      requirements: {
        wood: 10
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
      requirements: {
        wood: 15
      },
      rewards: {
        mushrooms: 2,
        beetles: 4,
        mud: 15
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
      requirements: {
        wood: 5
      },
      rewards: {
        mushrooms: 3,
        beetles: 1,
        mud: 25
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
      image: "/img/sunflowerland/build/mud.webp"
    }
  ]
}

export default caveData

