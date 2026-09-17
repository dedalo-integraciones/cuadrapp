export interface ProductItem {
  id: string | number;
  rubro: string;
  nombre: string;
  detalle_1: string;
  detalle_2: string;
  precio: number;
  color: string;
  activo: string;
  imagen?: string;
}

export interface RubroItem {
  id_rubro?: string | number;
  rubro: string;
  color: string;
  descrip?: string;
}

export interface MasterCatalog {
  productos: ProductItem[];
  rubros: string[];
  productosPorRubro: Record<string, ProductItem[]>;
  rubrosMap: Record<string, RubroItem>;
}

export interface ComboItem {
  id: string | number;
  nombre: string;
  detalle_1: string;
  detalle_2: string;
  precio: number;
  color: string;
  activo: string;
  imagen?: string;
}

export interface PriceKiloItem {
  id: string | number;
  nombre: string;
  detalle_1: string; // e.g. "Por kilo", "Llevando de a 2 kg"
  detalle_2: string; // e.g. "1 kg", "mas de 2 kg", "mas de 3 kg"
  precio: number;
  color: string;
  activo: string;
  imagen?: string;
}

export interface CartItem {
  id: string;
  itemId: string | number;
  rubro?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  color: string;
  imagen?: string;
  tipo?: string;
}

export interface OrderCustomerInfo {
  nombre: string;
  metodoEntrega: 'domicilio' | 'retiro';
  direccion: string;
  aclaraciones: string;
  metodoPago: 'efectivo' | 'transferencia';
}
