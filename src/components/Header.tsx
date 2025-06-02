import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bell, 
  Server, 
  Zap, 
  WifiOff, 
  Wifi,
  RefreshCw,
  Settings,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  isMobile: boolean;
  alertCount: number;
  clearAlerts: () => void;
}

const Header = ({ connected, isMobile, alertCount, clearAlerts }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      handleMenuClose();
      window.location.reload();
    }, 1000);
  };

  const handleClearAlerts = () => {
    clearAlerts();
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" color="transparent" sx={{ 
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(26, 26, 46, 0.8)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Server size={28} color="#3f88f2" />
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="h1"
            sx={{ 
              ml: 2, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            NOC Monitoring Dashboard
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Connection status indicator */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 2,
              bgcolor: connected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 82, 82, 0.2)',
              p: '4px 8px',
              borderRadius: 1,
              border: connected ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(255, 82, 82, 0.4)'
            }}
          >
            {connected ? 
              <Wifi size={16} color="#4caf50" /> : 
              <WifiOff size={16} color="#ff5252" />
            }
            <Typography variant="body2" sx={{ ml: 1, color: connected ? '#4caf50' : '#ff5252' }}>
              {connected ? 'Online' : 'Offline'}
            </Typography>
          </Box>

          {/* Alert bell */}
          <IconButton 
            color="inherit" 
            onClick={handleMenuOpen}
            sx={{ 
              ml: 1,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <Badge badgeContent={alertCount} color="error">
              <Bell size={24} color={alertCount > 0 ? "#ff5252" : "#ffffff"} />
            </Badge>
          </IconButton>

          {/* Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                width: 220,
                bgcolor: 'background.paper',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleRefresh}>
              <ListItemIcon>
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </ListItemIcon>
              <ListItemText primary="Refresh Data" />
            </MenuItem>
            
            {alertCount > 0 && (
              <MenuItem onClick={handleClearAlerts}>
                <ListItemIcon>
                  <Zap size={18} />
                </ListItemIcon>
                <ListItemText primary="Clear Alerts" />
              </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Settings size={18} />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogOut size={18} />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;