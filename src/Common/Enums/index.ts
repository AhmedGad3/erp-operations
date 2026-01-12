export enum UserRoles {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',

}

export enum OrderStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PLACED = 'placed',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}


export enum UnitCategory {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  LENGTH = 'length',
  AREA = 'area',
  COUNT = 'count',
}


export enum MainCategory {
  CONSTRUCTION_MATERIALS = "Construction-Materials",
  MEP = "Mechanical-Electrical-Plumbing",
  FINISHING_MATERIALS = "Finishing-Materials",
  TOOLS_EQUIPMENT = "Tools-Equipment",
  SAFETY_LOGISTICS = "Safety-Site-Logistics",
  ADMIN_SUPPLIES = "Administrative-Operational-Supplies",
  VEHICLES_TRANSPORT = "Vehicles-Transport",
  FURNITURE = "Furniture",
  FURNISHING_MATERIALS = "Furnishing-Materials",
  CONSUMABLES = "Consumables",
  OFFICE_EQUIPMENT = "Office-Equipment",
  OTHERS = "Others",
}


export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}