import React from 'react';
import { 
  TextField, 
  Grid, 
  Card, 
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem 
} from '@mui/material';

const ConnectionForm = ({ connection, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...connection, [name]: value });
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Host"
              name="host"
              value={connection.host}
              onChange={handleChange}
              required
              placeholder="example.clickhouse.cloud"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Port"
              name="port"
              value={connection.port}
              onChange={handleChange}
              required
              placeholder="8443"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Database"
              name="database"
              value={connection.database}
              onChange={handleChange}
              required
              placeholder="default"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={connection.username}
              onChange={handleChange}
              required
              placeholder="default"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={connection.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Protocol</InputLabel>
              <Select
                name="protocol"
                value={connection.protocol}
                onChange={handleChange}
                label="Protocol"
              >
                <MenuItem value="https">HTTPS</MenuItem>
                <MenuItem value="http">HTTP</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="JWT Token (Optional)"
              name="jwtToken"
              value={connection.jwtToken || ''}
              onChange={handleChange}
              placeholder="For services that use JWT authentication"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ConnectionForm; 