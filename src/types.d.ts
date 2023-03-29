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
  name: ''
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
