export type AppointmentStatus = "confirmed" | "pending" | "completed" | "cancelled";

export type MockAppointment = {
  id: number;
  client: string;
  service: string;
  time: string;
  date: string; // ISO yyyy-mm-dd
  value: number;
  status: AppointmentStatus;
};

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const dayOffset = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const mockAppointments: MockAppointment[] = [
  { id: 1, client: "Carlos Silva", service: "Corte de Cabelo", time: "09:00", date: dayOffset(0), value: 30, status: "confirmed" },
  { id: 2, client: "Rafael Souza", service: "Barba", time: "10:00", date: dayOffset(0), value: 15, status: "pending" },
  { id: 3, client: "Bruno Lima", service: "Corte + Barba", time: "11:00", date: dayOffset(0), value: 45, status: "confirmed" },
  { id: 4, client: "Lucas Martins", service: "Cuidado de Pele", time: "14:00", date: dayOffset(0), value: 10, status: "completed" },
  { id: 5, client: "Felipe Costa", service: "Corte de Cabelo", time: "16:00", date: dayOffset(0), value: 30, status: "confirmed" },
  { id: 6, client: "Diego Ramos", service: "Sobrancelha", time: "09:30", date: dayOffset(-1), value: 10, status: "completed" },
  { id: 7, client: "Pedro Henrique", service: "Corte + Barba", time: "15:00", date: dayOffset(-1), value: 45, status: "completed" },
  { id: 8, client: "Marcos Vinícius", service: "Corte com Luzes", time: "10:00", date: dayOffset(-2), value: 125, status: "completed" },
  { id: 9, client: "André Rocha", service: "Acabamento", time: "11:30", date: dayOffset(-3), value: 10, status: "completed" },
  { id: 10, client: "Tiago Nunes", service: "Corte de Cabelo", time: "16:30", date: dayOffset(-4), value: 30, status: "completed" },
  { id: 11, client: "Vinicius Alves", service: "Corte com Alisamento", time: "13:00", date: dayOffset(-5), value: 85, status: "completed" },
  { id: 12, client: "João Pedro", service: "Barba", time: "09:00", date: dayOffset(-6), value: 15, status: "completed" },
  { id: 13, client: "Eduardo Lima", service: "Corte + Sobrancelha", time: "14:30", date: dayOffset(2), value: 40, status: "confirmed" },
];

export type MockProduct = {
  id: number;
  name: string;
  category: "Pomada" | "Shampoo" | "Óleo" | "Acessório" | "Outro";
  description: string;
  price: number;
  stock: number;
  image?: string;
};

export const initialMockProducts: MockProduct[] = [
  { id: 1, name: "Pomada Modeladora Black", category: "Pomada", description: "Fixação forte com brilho seco.", price: 45, stock: 12 },
  { id: 2, name: "Shampoo Antiqueda", category: "Shampoo", description: "Fortalece os fios e o couro cabeludo.", price: 38, stock: 8 },
  { id: 3, name: "Óleo para Barba", category: "Óleo", description: "Hidratação e perfume amadeirado.", price: 52, stock: 15 },
  { id: 4, name: "Pente Profissional", category: "Acessório", description: "Pente de carbono antiestático.", price: 22, stock: 30 },
  { id: 5, name: "Loção Pós-Barba", category: "Outro", description: "Acalma e refresca a pele.", price: 35, stock: 20 },
];

export type MockService = {
  id: number;
  name: string;
  duration: number;
  price: number;
  description: string;
};

export const initialMockServices: MockService[] = [
  { id: 1, name: "Corte de Cabelo", duration: 60, price: 30, description: "Corte clássico ou moderno." },
  { id: 2, name: "Barba", duration: 30, price: 15, description: "Modelagem e finalização." },
  { id: 3, name: "Corte + Barba", duration: 90, price: 45, description: "Combo completo." },
  { id: 4, name: "Sobrancelha", duration: 20, price: 10, description: "Design masculino." },
  { id: 5, name: "Cuidado de Pele", duration: 30, price: 10, description: "Limpeza e hidratação." },
  { id: 6, name: "Acabamento", duration: 30, price: 10, description: "Retoque entre cortes." },
  { id: 7, name: "Corte + Sobrancelha", duration: 60, price: 40, description: "Combo express." },
  { id: 8, name: "Corte com Alisamento", duration: 75, price: 85, description: "Alisamento progressivo." },
  { id: 9, name: "Corte com Luzes", duration: 120, price: 125, description: "Mechas e iluminado." },
  { id: 10, name: "Corte com Platinado", duration: 120, price: 155, description: "Descoloração platinada." },
];