import { type ListProps, Count } from 'react-admin'
import { type ReactElement } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import * as constants from '../constants'

type Props = PartialBy<ListProps, 'children'> & { id: number }

export function SignatureDetails() {
  return (
    <>
      <Box>
        <Typography>Name (printed):</Typography>
        <Typography>Signature:</Typography>
        <Typography>Date:</Typography>
        <Typography>Rank/Grade:</Typography>
      </Box>
    </>
  )
}

export function ProtectiveMarking() {
  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>PM</TableCell>
            <TableCell>Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>P1</TableCell>
            <TableCell>2</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  )
}

export default function ReportSignature(props: Props): ReactElement {
  const { id } = props
  return (
    <>
      <Box>
        <ProtectiveMarking />
      </Box>
      <Box
        sx={{
          display: 'inline-block',
          width: 'calc(50% - 24px)',
          border: '2px solid rgba(224, 224, 224, 1)',
          padding: '10px'
        }}>
        <Typography>
          The{' '}
          {
            <Count
              resource={constants.R_ITEMS}
              sx={{ fontSize: '1rem' }}
              filter={{ vaultLocation: id }}
            />
          }{' '}
          items listed above have been 100%
        </Typography>
        <Typography>Mustered by:</Typography>
        <SignatureDetails />
      </Box>
      <Box
        sx={{
          display: 'inline-block',
          border: '2px solid rgba(224, 224, 224, 1)',
          padding: '10px',
          borderLeft: 'none',
          width: 'calc(50% - 24px)',
          paddingTop: '58px'
        }}>
        <SignatureDetails />
      </Box>
    </>
  )
}
