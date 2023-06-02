import { useState } from 'react'
import { type ResourceTypes } from '../constants'
import { useListContext, useRedirect } from 'react-admin'

const useDoubleClick = (resource: ResourceTypes): ((id: number) => false) => {
  const { onSelect, selectedIds } = useListContext(resource)
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null)
  const redirect = useRedirect()
  const handleClick = (id: number): void => {
    const idNums = selectedIds as number[]
    if (idNums.includes(id)) {
      onSelect(idNums.filter((selectedId) => selectedId !== id))
    } else {
      onSelect([...idNums, id])
    }
  }

  const handleDoubleClick = (id: number): void => {
    const path = `/${resource}/${id}/show`
    redirect(path)
  }

  const handleRowClick = (id: number): false => {
    if (clickTimer !== null) {
      clearTimeout(clickTimer)
      setClickTimer(null)
      handleDoubleClick(id)
    } else {
      setClickTimer(
        setTimeout(() => {
          setClickTimer(null)
          handleClick(id)
        }, 200)
      )
    }
    return false
  }

  return handleRowClick
}

export default useDoubleClick
