export const COULEURS = [
  '#185fa5','#0f6e56','#993c1d','#993556',
  '#534ab7','#854f0b','#1a6b4a','#7b2d8b'
]

export interface Trip {
  id: string; code: string; nom: string; type: string
  destination?: string; date_debut?: string; date_fin?: string; created_at: string
}
export interface Membre {
  id: string; trip_id: string; prenom: string; couleur: string; created_at: string
}
export interface ArchiveItem {
  id: string; trip_id: string; categorie: string; titre: string
  details?: string; url?: string; membre_prenom?: string; created_at: string
}
export interface Message {
  id: string; trip_id: string; type: string; contenu?: string
  photo_url?: string; photo_caption?: string
  membre_id?: string; membre_prenom?: string; membre_couleur?: string; created_at: string
}
export interface Photo {
  id: string; trip_id: string; storage_path: string; url: string
  caption?: string; taille_bytes?: number; membre_prenom?: string; created_at: string
}
export const LIMITE_BYTES = 1 * 1024 * 1024 * 1024
export const CAT_ICONS: Record<string,string> = {
  avion:'✈', lodge:'🏠', note:'📝', equip:'🎒', autre:'📎'
}
export const CAT_LABELS: Record<string,string> = {
  avion:'Vols', lodge:'Lodge', note:'Notes', equip:'Équipement', autre:'Autre'
}
export const TRIP_ICONS: Record<string,string> = {
  peche:'🎣', ski:'⛷', autre:'🏕'
}
