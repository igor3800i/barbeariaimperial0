export type AppointmentStatus = "confirmed" | "pending" | "completed" | "cancelled";

export type MockAppointment = {
  id: number;
  clientName: string;
  clientPhone: string;
  service: string;
  time: string;
  date: string; // ISO yyyy-mm-dd
  serviceValue: number;
  status: AppointmentStatus;
  createdAt?: string;
};

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const dayOffset = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const mockAppointments: MockAppointment[] = [
  { id: 1, clientName: "Carlos Silva", clientPhone: "(11) 98765-4321", service: "Corte de Cabelo", time: "09:00", date: dayOffset(0), serviceValue: 45, status: "confirmed" },
  { id: 2, clientName: "Rafael Souza", clientPhone: "(11) 97654-3210", service: "Barba", time: "10:00", date: dayOffset(0), serviceValue: 35, status: "pending" },
  { id: 3, clientName: "Bruno Lima", clientPhone: "(11) 96543-2109", service: "Corte + Barba", time: "11:00", date: dayOffset(0), serviceValue: 70, status: "confirmed" },
  { id: 4, clientName: "Lucas Martins", clientPhone: "(11) 95432-1098", service: "Hidratação", time: "14:00", date: dayOffset(0), serviceValue: 55, status: "completed" },
  { id: 5, clientName: "Felipe Costa", clientPhone: "(11) 94321-0987", service: "Corte de Cabelo", time: "16:00", date: dayOffset(0), serviceValue: 45, status: "confirmed" },
  { id: 6, clientName: "Diego Ramos", clientPhone: "(11) 93210-9876", service: "Sobrancelha", time: "09:30", date: dayOffset(-1), serviceValue: 10, status: "completed" },
  { id: 7, clientName: "Pedro Henrique", clientPhone: "(11) 92109-8765", service: "Corte + Barba", time: "15:00", date: dayOffset(-1), serviceValue: 70, status: "completed" },
  { id: 8, clientName: "Marcos Vinícius", clientPhone: "(11) 91098-7654", service: "Corte com Luzes", time: "10:00", date: dayOffset(-2), serviceValue: 125, status: "completed" },
  { id: 9, clientName: "André Rocha", clientPhone: "(11) 99087-6543", service: "Acabamento", time: "11:30", date: dayOffset(-3), serviceValue: 10, status: "completed" },
  { id: 10, clientName: "Tiago Nunes", clientPhone: "(11) 98076-5432", service: "Corte de Cabelo", time: "16:30", date: dayOffset(-4), serviceValue: 45, status: "completed" },
  { id: 11, clientName: "Vinicius Alves", clientPhone: "(11) 97065-4321", service: "Corte com Alisamento", time: "13:00", date: dayOffset(-5), serviceValue: 85, status: "completed" },
  { id: 12, clientName: "João Pedro", clientPhone: "(11) 96054-3210", service: "Barba", time: "09:00", date: dayOffset(-6), serviceValue: 35, status: "completed" },
  { id: 13, clientName: "Eduardo Lima", clientPhone: "(11) 95043-2109", service: "Corte + Sobrancelha", time: "14:30", date: dayOffset(2), serviceValue: 40, status: "confirmed" },
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