import React, { useEffect, useState } from 'react'
import {
  BooleanField,
  CreateButton,
  Datagrid,
  List,
  TextField,
  TopToolbar,
  ArrayField,
  SingleFieldList,
  useRecordContext,
  useListContext,
  useUpdate,
  useNotify,
  type Identifier
} from 'react-admin'
import { Button, Chip } from '@mui/material'
import { Article, KeyboardReturn } from '@mui/icons-material'
import UserMusterList from './UserMusterList'
import { rolesOptions } from '../../utils/options'
import useCanAccess from '../../hooks/useCanAccess'
import * as constants from '../../constants'
import useDoubleClick from '../../hooks/useDoubleClick'

interface Props {
  name: string
}

export default function UserList(props: Props): React.ReactElement {
  const { name } = props
  const cName: string = name
  const basePath: string = `/${cName}`
  const { hasAccess } = useCanAccess()

  const hasWriteAccess = hasAccess(constants.R_USERS, { write: true })

  const ListActions = (): React.ReactElement => {
    return (
      <TopToolbar>
        {hasWriteAccess ? <CreateButton to={`${basePath}/create`} /> : null}
      </TopToolbar>
    )
  }

  return (
    <List actions={<ListActions />} perPage={25} resource={cName}>
      <DataList />
    </List>
  )
}

const DataList = (): React.ReactElement => {
  const [open, setOpen] = useState(false)
  const handleRowClick = useDoubleClick(constants.R_USERS)

  const handleOpen = (open: boolean) => () => {
    setOpen(open)
  }
  const UserActions = (): React.ReactElement => {
    const { selectedIds, data } = useListContext()
    const [showReturn, setShowReturn] = useState<boolean>(false)
    const [selectedUser, setSelectedUser] = useState<User[] | null>(null)
    const [update] = useUpdate<User>()
    const notify = useNotify()

    useEffect(() => {
      const users = data.filter((user: User) => selectedIds.includes(user.id))
      setSelectedUser(users)
      setShowReturn(
        users.every((user: User) => user.departedDate !== undefined)
      )
    }, [selectedIds, data])

    const handleUserReturn = (): void => {
      if (selectedUser !== null) {
        selectedUser.forEach((user) => {
          update(constants.R_USERS, {
            id: user.id,
            previousData: user,
            data: {
              departedDate: undefined,
              active: true
            }
          }).catch(console.log)
        })
        notify('User Returned')
      }
    }

    return (
      <>
        <Button
          startIcon={<Article />}
          sx={{ lineHeight: '1.5' }}
          size='small'
          onClick={handleOpen(true)}>
          User Muster List
        </Button>
        {showReturn && (
          <Button
            startIcon={<KeyboardReturn />}
            sx={{ lineHeight: '1.5' }}
            size='small'
            onClick={handleUserReturn}>
            Return
          </Button>
        )}
      </>
    )
  }
  return (
    <>
      <Datagrid
        sx={{
          '& .RaDatagrid-headerCell': {
            fontWeight: 'bold',
            fontSize: '16px'
          }
        }}
        rowClick={(id: Identifier) => handleRowClick(id as number)}
        bulkActionButtons={<UserActions />}>
        <TextField source='staffNumber' label='Staff number' />
        <TextField source='name' />
        <BooleanField source='adminRights' label='Admin Rights' />
        <BooleanField source='active' label='Active User' />
        <ArrayField source='roles'>
          <SingleFieldList sx={{ columnGap: 1 }}>
            <ChipField />
          </SingleFieldList>
        </ArrayField>
      </Datagrid>
      <UserMusterList open={open} onClose={handleOpen(false)} />
    </>
  )
}

function ChipField(): React.ReactElement {
  const record = useRecordContext<any>()

  const role = rolesOptions.find(({ value }) => value === record)

  if (typeof role === 'undefined') return <></>

  return <Chip size='small' label={role.label} />
}
