interface User {
  id: number
  name: string
  password: string
  adminRights: boolean
}

interface Audit {
  id: number
  activity_type: string
  date_time: string
  activity_detail?: string
}

interface Platform {
  id: number
  name: string
  active: boolean
}

interface Project {
  id: number
  name: string
  start_date: string
  end_date: string
  project_code: string
  remarks: string
}

interface Batch {
  id: number
  name: string
  batch_number: string
  vault: number
  year_of_receipt: string
  department: number
  project: number
  platform: number
  organisation: number
  protective_marking_authority: number
  maximum_protective_marking: number
  remarks: string
}

interface MagTape {
  brand: string
  minutes: number
}

interface CoreMedia {
  readonly mediaType: MediaType
}
interface DVD extends CoreMedia {
  size: number
}

interface Tape extends CoreMedia {
  minutes: number
  brand: string
}

interface Item {
  id: number
  media_type: MediaType
  start: string
  batch_id: number
  end: string
  vault_location: number
  remarks: string
  protective_marking: number
  mag_tape: MagTape
  dvd: DVD
  paper: Paper
}

enum MediaType {
  DVD = 'DVD',
  TAPE = 'Tape',
  PAPER = 'Paper',
  LOANS = 'Loans'
}
