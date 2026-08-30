import {
  // Mercado & Comida
  ShoppingCart, Utensils, Coffee, Pizza, Apple, Wine, IceCream, Cookie,
  // Transporte & Viagens
  Car, Plane, Fuel, Bus, Bike, Train, Compass, MapPin, Ship,
  // Casa, Moradia & Contas
  Home, Wifi, Tv, Zap, Droplets, Flame, Shield, Key, Bed,
  // Saúde & Bem-estar
  Activity, HeartPulse, Stethoscope, Pill, Smile, Baby, Dumbbell,
  // Educação & Trabalho
  GraduationCap, BookOpen, Briefcase, Laptop, Building, PenTool, Award,
  // Lazer, Entretenimento & Estilo
  Gamepad2, Film, Music, Headphones, Camera, Shirt, Sparkles, Gift, Palette, Scissors,
  // Pets & Natureza
  PawPrint, Dog, Cat, Fish, Trees, Flower2,
  // Finanças, Bancos & Investimentos
  Wallet, CreditCard, Banknote, TrendingUp, PiggyBank, Coins, DollarSign,
  Receipt, Bitcoin, Landmark, Gem, ShieldCheck, Scale,
  // Serviços & Outros
  Wrench, Hammer, Package, Clock, Smartphone, Globe, Star, Tag, HelpCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface IconOption {
  value: string;
  label: string;
  category?: string;
  Icon: LucideIcon;
}

// ── CATÁLOGO EXPANDIDO DE ÍCONES PARA CATEGORIAS ──
export const CATEGORY_ICONS: IconOption[] = [
  // Alimentação & Mercado
  { value: 'cart-outline', label: 'Supermercado', category: 'Alimentação', Icon: ShoppingCart },
  { value: 'restaurant-outline', label: 'Restaurante', category: 'Alimentação', Icon: Utensils },
  { value: 'coffee', label: 'Café & Lanches', category: 'Alimentação', Icon: Coffee },
  { value: 'pizza', label: 'Delivery / Fast Food', category: 'Alimentação', Icon: Pizza },
  { value: 'apple', label: 'Hortifruti & Feira', category: 'Alimentação', Icon: Apple },
  { value: 'wine', label: 'Bebidas & Bares', category: 'Alimentação', Icon: Wine },
  { value: 'ice-cream', label: 'Sobremesas', category: 'Alimentação', Icon: IceCream },
  { value: 'cookie', label: 'Padaria & Doces', category: 'Alimentação', Icon: Cookie },

  // Transporte & Viagens
  { value: 'car-outline', label: 'Carro / Combustível', category: 'Transporte', Icon: Car },
  { value: 'fuel', label: 'Posto de Gasolina', category: 'Transporte', Icon: Fuel },
  { value: 'bus', label: 'Transporte Público', category: 'Transporte', Icon: Bus },
  { value: 'bike', label: 'Bicicleta / Mobilidade', category: 'Transporte', Icon: Bike },
  { value: 'train', label: 'Metrô / Trem', category: 'Transporte', Icon: Train },
  { value: 'airplane-outline', label: 'Viagens & Passagens', category: 'Transporte', Icon: Plane },
  { value: 'compass', label: 'Passeios & Turismo', category: 'Transporte', Icon: Compass },
  { value: 'map-pin', label: 'Estacionamento & Pedágio', category: 'Transporte', Icon: MapPin },
  { value: 'ship', label: 'Cruzeiro / Barco', category: 'Transporte', Icon: Ship },

  // Moradia & Contas Fixas
  { value: 'home-outline', label: 'Moradia / Aluguel', category: 'Moradia', Icon: Home },
  { value: 'zap', label: 'Energia Elétrica', category: 'Moradia', Icon: Zap },
  { value: 'droplets', label: 'Água & Saneamento', category: 'Moradia', Icon: Droplets },
  { value: 'flame', label: 'Gás Encanado/Botijão', category: 'Moradia', Icon: Flame },
  { value: 'wifi-outline', label: 'Internet / Banda Larga', category: 'Moradia', Icon: Wifi },
  { value: 'tv-outline', label: 'TV & Streaming', category: 'Moradia', Icon: Tv },
  { value: 'key', label: 'Condomínio & IPTU', category: 'Moradia', Icon: Key },
  { value: 'shield', label: 'Segurança & Seguros', category: 'Moradia', Icon: Shield },
  { value: 'bed', label: 'Móveis & Decoração', category: 'Moradia', Icon: Bed },

  // Saúde & Bem-estar
  { value: 'medical-outline', label: 'Saúde & Consultas', category: 'Saúde', Icon: Activity },
  { value: 'heart-pulse', label: 'Plano de Saúde', category: 'Saúde', Icon: HeartPulse },
  { value: 'stethoscope', label: 'Exames Médicos', category: 'Saúde', Icon: Stethoscope },
  { value: 'pill', label: 'Farmácia & Remédios', category: 'Saúde', Icon: Pill },
  { value: 'smile', label: 'Dentista / Odonto', category: 'Saúde', Icon: Smile },
  { value: 'baby', label: 'Bebê & Maternidade', category: 'Saúde', Icon: Baby },
  { value: 'barbell-outline', label: 'Academia & Esportes', category: 'Saúde', Icon: Dumbbell },

  // Educação & Trabalho
  { value: 'school-outline', label: 'Educação & Cursos', category: 'Educação', Icon: GraduationCap },
  { value: 'book-open', label: 'Livros & Material', category: 'Educação', Icon: BookOpen },
  { value: 'laptop', label: 'Equipamentos & Software', category: 'Trabalho', Icon: Laptop },
  { value: 'briefcase', label: 'Trabalho & Negócios', category: 'Trabalho', Icon: Briefcase },
  { value: 'pen-tool', label: 'Design & Criação', category: 'Trabalho', Icon: PenTool },
  { value: 'award', label: 'Certificações', category: 'Educação', Icon: Award },

  // Lazer, Estilo & Compras
  { value: 'game-controller-outline', label: 'Jogos & Games', category: 'Lazer', Icon: Gamepad2 },
  { value: 'film', label: 'Cinema & Teatro', category: 'Lazer', Icon: Film },
  { value: 'music', label: 'Shows & Música', category: 'Lazer', Icon: Music },
  { value: 'headphones', label: 'Podcasts & Áudio', category: 'Lazer', Icon: Headphones },
  { value: 'camera', label: 'Fotografia & Eventos', category: 'Lazer', Icon: Camera },
  { value: 'shirt-outline', label: 'Roupas & Vestuário', category: 'Estilo', Icon: Shirt },
  { value: 'scissors', label: 'Cabelo & Barbeiro', category: 'Estilo', Icon: Scissors },
  { value: 'sparkles', label: 'Beleza & Cosméticos', category: 'Estilo', Icon: Sparkles },
  { value: 'gift-outline', label: 'Presentes & Doações', category: 'Compras', Icon: Gift },
  { value: 'palette', label: 'Hobbies & Artes', category: 'Lazer', Icon: Palette },
  { value: 'phone-portrait-outline', label: 'Celular & Recarga', category: 'Tecnologia', Icon: Smartphone },

  // Pets & Natureza
  { value: 'paw-outline', label: 'Pet Geral', category: 'Pets', Icon: PawPrint },
  { value: 'dog', label: 'Cachorro / Ração', category: 'Pets', Icon: Dog },
  { value: 'cat', label: 'Gato / Veterinário', category: 'Pets', Icon: Cat },
  { value: 'fish', label: 'Aquário / Animais', category: 'Pets', Icon: Fish },
  { value: 'trees', label: 'Jardim & Plantas', category: 'Pets', Icon: Trees },
  { value: 'flower', label: 'Floricultura', category: 'Pets', Icon: Flower2 },

  // Finanças, Receitas & Impostos
  { value: 'cash-outline', label: 'Salário & Renda', category: 'Finanças', Icon: Banknote },
  { value: 'trending-up-outline', label: 'Investimentos & Ações', category: 'Finanças', Icon: TrendingUp },
  { value: 'piggy-bank', label: 'Poupança / Cofrinho', category: 'Finanças', Icon: PiggyBank },
  { value: 'coins', label: 'Rendimentos & Dividendos', category: 'Finanças', Icon: Coins },
  { value: 'dollar-sign', label: 'Dólar & Câmbio', category: 'Finanças', Icon: DollarSign },
  { value: 'bitcoin', label: 'Cripto & Web3', category: 'Finanças', Icon: Bitcoin },
  { value: 'receipt', label: 'Impostos & Taxas', category: 'Finanças', Icon: Receipt },
  { value: 'scale', label: 'Serviços Jurídicos', category: 'Finanças', Icon: Scale },
  { value: 'card-outline', label: 'Cartão de Crédito', category: 'Finanças', Icon: CreditCard },

  // Serviços Gerais
  { value: 'build-outline', label: 'Manutenção & Obras', category: 'Serviços', Icon: Wrench },
  { value: 'hammer', label: 'Reformas & Ferramentas', category: 'Serviços', Icon: Hammer },
  { value: 'package', label: 'Entregas & Fretes', category: 'Serviços', Icon: Package },
  { value: 'clock', label: 'Mensalidades & Assinaturas', category: 'Serviços', Icon: Clock },
  { value: 'pricetag-outline', label: 'Outros / Diversos', category: 'Geral', Icon: Tag },
  { value: 'help-circle', label: 'Dúvidas / Não Classificado', category: 'Geral', Icon: HelpCircle },
];

// ── CATÁLOGO EXPANDIDO DE ÍCONES PARA CONTAS BANCÁRIAS ──
export const ACCOUNT_ICONS: IconOption[] = [
  { value: 'wallet-outline', label: 'Carteira Física', Icon: Wallet },
  { value: 'business-outline', label: 'Banco Tradicional', Icon: Building },
  { value: 'landmark', label: 'Instituição Financeira / Tesouro', Icon: Landmark },
  { value: 'card-outline', label: 'Cartão de Crédito', Icon: CreditCard },
  { value: 'cash-outline', label: 'Dinheiro em Espécie', Icon: Banknote },
  { value: 'phone-portrait-outline', label: 'Banco Digital / Fintech', Icon: Smartphone },
  { value: 'trending-up-outline', label: 'Corretora de Investimentos', Icon: TrendingUp },
  { value: 'piggy-bank', label: 'Conta Poupança / Cofrinho', Icon: PiggyBank },
  { value: 'coins', label: 'Reserva de Emergência', Icon: Coins },
  { value: 'dollar-sign', label: 'Conta Câmbio / Moeda Estrangeira', Icon: DollarSign },
  { value: 'bitcoin', label: 'Carteira Cripto / Exchange', Icon: Bitcoin },
  { value: 'globe-outline', label: 'Conta Internacional / Global', Icon: Globe },
  { value: 'briefcase-outline', label: 'Conta Jurídica / PJ', Icon: Briefcase },
  { value: 'shield-check', label: 'Previdência / Fundo Seguro', Icon: ShieldCheck },
  { value: 'gem', label: 'Conta Premium / Black', Icon: Gem },
  { value: 'receipt', label: 'Conta de Pagamentos / Benefício', Icon: Receipt },
  { value: 'star-outline', label: 'Conta Favorita / Principal', Icon: Star },
  { value: 'home-outline', label: 'Conta Família / Residencial', Icon: Home },
];

// ── MAPA RÁPIDO PARA RESOLVER QUALQUER ÍCONE POR STRING ──
export const ALL_ICONS_MAP: Record<string, LucideIcon> = {
  // Ícones de categoria
  ...Object.fromEntries(CATEGORY_ICONS.map(i => [i.value, i.Icon])),
  // Ícones de conta
  ...Object.fromEntries(ACCOUNT_ICONS.map(i => [i.value, i.Icon])),
  // Aliases comuns de material/ionicons
  'cart': ShoppingCart,
  'restaurant': Utensils,
  'car': Car,
  'home': Home,
  'medical': Activity,
  'school': GraduationCap,
  'shirt': Shirt,
  'game-controller': Gamepad2,
  'airplane': Plane,
  'phone-portrait': Smartphone,
  'barbell': Dumbbell,
  'paw': PawPrint,
  'cash': Banknote,
  'trending-up': TrendingUp,
  'gift': Gift,
  'wifi': Wifi,
  'tv': Tv,
  'pricetag': Tag,
  'build': Wrench,
  'card': CreditCard,
  'wallet': Wallet,
  'business': Building,
  'globe': Globe,
  'briefcase': Briefcase,
  'star': Star,
};

export function getIconComponent(iconName?: string | null, defaultIcon: LucideIcon = Tag): LucideIcon {
  if (!iconName) return defaultIcon;
  return ALL_ICONS_MAP[iconName] || defaultIcon;
}
