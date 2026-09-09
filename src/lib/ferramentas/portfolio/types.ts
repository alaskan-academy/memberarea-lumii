export interface PortfolioItem {
  id: string;
  titulo: string;
  descricao: string;
  anexoUrl: string | null; // URL assinada (curta) da foto, ou null se item só de texto
  anexoMime: string | null;
  created_at: string;
}
