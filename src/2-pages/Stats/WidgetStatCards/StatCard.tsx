import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'

type StatCardProps = {
  title: string | React.ReactNode
  value: string | number
  color?: string
  tooltip?: React.ReactNode
}

const styles = {
  cardContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    justifyContent: 'center',
    p: 2
  },
  value: {
    wordBreak: 'break-word' as const,
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
  },
  valueWrapper: {
    whiteSpace: 'nowrap' as const
  }
}

export const StatCard = React.memo(
  function StatCard({title, value, color, tooltip}: StatCardProps) {
    const content = (
      <Paper sx={{height: '100%'}}>
        <Box sx={styles.cardContent}>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            component="div"
            sx={{
              ...styles.value,
              color: color || 'inherit'
            }}
          >
            <span style={styles.valueWrapper}>{value}</span>
          </Typography>
        </Box>
      </Paper>
    )

    return tooltip ? (
      <Tooltip title={tooltip} arrow>
        {content}
      </Tooltip>
    ) : content
  })
