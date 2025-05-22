import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Input, 
  Button, 
  Space, 
  Tag, 
  DatePicker, 
  Select, 
  Badge, 
  Avatar,
  Breadcrumb,
  Row,
  Col,
  Statistic,
  Divider,
  message,
  Modal
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  HomeOutlined, 
  TeamOutlined, 
  FilterOutlined,
  UserOutlined,
  CalendarOutlined,
  BarChartOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { motion } from 'framer-motion';
import './RoleAllocation.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Create axios instance with base URL and timeout
const api = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  timeout: 10000
});

// Role mapping from the main component
const ROLE_MAPPING = {
  "MD": { description: "Managing Director/ Founder", parent: "" },
  "CF": { description: "Co - Founder", parent: "MD" },
  "CEO": { description: "Chief Executive Officer", parent: "MD" },
  "CTO": { description: "Chief Technology Officer", parent: "MD" },
  "COO": { description: "Chief Operative Officer", parent: "MD" },
  "CFO": { description: "Chief Financial Officer", parent: "MD" },
  "VP": { description: "Vice President", parent: "CEO" },
  "AVP": { description: "Assistant Vice President", parent: "VP" },
  "SSA": { description: "Senior Solution Architect", parent: "AVP" },
  "SA": { description: "Solution Architect", parent: "SSA" },
  "SSE": { description: "Senior Software Engineer", parent: "SA" },
  "SE": { description: "Software Engineer", parent: "SSE" },
  "TRN": { description: "Traniee", parent: "SSE" },
  "INTRN": { description: "Internship Trainee", parent: "SSE" }
};

const RoleAllocationsList = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    employeeId: null,
    roleId: null,
    dateRange: null
  });
  const [stats, setStats] = useState({
    total: 0,
    recent: 0,
    roleDistribution: []
  });
  const navigate = useNavigate();

  // Get role allocations with filtering/pagination
  const fetchAllocations = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      // Build query parameters
      let url = `/api/role_allocations?limit=${pageSize}`;
      
      if (filters.employeeId) {
        url += `&employee_id=${filters.employeeId}`;
      }
      
      if (filters.roleId) {
        url += `&role_id=${filters.roleId}`;
      }
      
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        url += `&from_date=${filters.dateRange[0].format('YYYY-MM-DD')}`;
        url += `&to_date=${filters.dateRange[1].format('YYYY-MM-DD')}`;
      }
      
      const res = await api.get(url);
      
      // Transform data for the table
      const transformedData = res.data.allocations.map(item => ({
        key: item.id.toString(),
        id: item.id,
        employeeId: item.employee_id,
        employeeName: item.employee_name,
        roleId: item.role_id,
        roleName: item.role_name,
        allocatedDate: item.allocated_date,
        reportingPerson: item.reporting_person || 'N/A'
      }));
      
      setAllocations(transformedData);
      
      // Update pagination
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.stats.total || 0
      });
      
      // Store stats
      setStats({
        total: res.data.stats.total || 0,
        recent: res.data.stats.recent || 0,
        roleDistribution: res.data.stats.roleDistribution || []
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
      message.error('Failed to load role allocations');
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAllocations();
    
    // Also fetch stats directly
    api.get('/api/role_allocations_stats')
      .then(res => {
        setStats({
          total: res.data.total || 0,
          recent: res.data.recent || 0,
          roleDistribution: res.data.roleDistribution || []
        });
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
      });
  }, []);

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setFilters({
      ...filters,
      [type]: value
    });
  };

  // Apply filters
  const applyFilters = () => {
    fetchAllocations(1, pagination.pageSize);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      employeeId: null,
      roleId: null,
      dateRange: null
    });
    fetchAllocations(1, pagination.pageSize);
  };

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    fetchAllocations(pagination.current, pagination.pageSize);
  };

  // Export data
  const handleExport = (format) => {
    message.info(`Exporting data as ${format}...`);
    // Implement export functionality here
  };

  // Table columns definition
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeId',
      key: 'employeeId',
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.employeeName}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{text}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'roleId',
      key: 'roleId',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Tag color="blue">{text}</Tag>
          <span style={{ fontSize: '12px' }}>{record.roleName}</span>
        </Space>
      ),
      filters: Object.keys(ROLE_MAPPING).map(role => ({
        text: `${role} - ${ROLE_MAPPING[role].description}`,
        value: role
      })),
      onFilter: (value, record) => record.roleId === value,
    },
    {
      title: 'Date Allocated',
      dataIndex: 'allocatedDate',
      key: 'allocatedDate',
      sorter: (a, b) => moment(a.allocatedDate).unix() - moment(b.allocatedDate).unix(),
      render: (text) => {
        const date = moment(text);
        const isRecent = moment().diff(date, 'days') <= 7;
        return (
          <Space>
            {isRecent && <Badge status="success" />}
            {date.format('DD MMM YYYY')}
          </Space>
        );
      },
    },
    {
      title: 'Reports To',
      dataIndex: 'reportingPerson',
      key: 'reportingPerson',
      render: (text) => {
        if (text === 'N/A' || text === 'N/A - Top Level Position') {
          return <Tag color="green">Top Level</Tag>;
        }
        const parts = text.split(',');
        return parts.length > 1 ? (
          <Space>
            <Tag color="purple">{parts[0]}</Tag>
            <span>{parts[1]}</span>
          </Space>
        ) : text;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space>
          <Button 
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/role-allocation?allocation_id=${record.id}`)}
          />
          <Button 
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Role Allocation',
                content: `Are you sure you want to delete the role allocation for ${record.employeeName}?`,
                okText: 'Yes, Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: async () => {
                  try {
                    const res = await api.delete(`/api/role_allocations/${record.id}`);
                    if (res.status === 200) {
                      message.success('Role allocation deleted successfully');
                      // Refresh the allocations list
                      fetchAllocations(pagination.current, pagination.pageSize);
                    }
                  } catch (error) {
                    console.error('Failed to delete role allocation:', error);
                    message.error(error.response?.data?.message || 'Failed to delete role allocation');
                  }
                }
              });
            }}
          />
        </Space>
      )
    }
  ];

  return (
    <motion.div 
      className="role-allocation-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Breadcrumb Navigation */}
      <div className="page-breadcrumb">
        <Breadcrumb
          items={[
            {
              title: (
                <>
                  <HomeOutlined /> Home
                </>
              ),
              href: '/'
            },
            {
              title: 'Role Allocation',
              href: '/role-allocation'
            },
            {
              title: 'All Allocations'
            }
          ]}
        />
      </div>
      
      {/* Page Header */}
      <div className="role-allocation-header">
        <TeamOutlined className="header-icon" />
        <span className="header-text">Role Allocations</span>
      </div>
      
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card className="stats-card">
            <Statistic 
              title="Total Allocations" 
              value={stats.total} 
              prefix={<TeamOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="stats-card">
            <Statistic 
              title="Recent Allocations (30 days)" 
              value={stats.recent} 
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card className="stats-card">
            <Statistic 
              title="Top Role" 
              value={stats.roleDistribution && stats.roleDistribution[0] ? 
                stats.roleDistribution[0].role_id : 'N/A'} 
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={stats.roleDistribution && stats.roleDistribution[0] ? 
                `(${stats.roleDistribution[0].count} allocations)` : ''}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Filters and Actions */}
      <Card className="role-allocation-card" style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={6}>
            <Input 
              placeholder="Search by Employee ID" 
              prefix={<UserOutlined />}
              allowClear
              value={filters.employeeId}
              onChange={e => handleFilterChange('employeeId', e.target.value)}
            />
          </Col>
          
          <Col xs={24} md={6}>
            <Select 
              placeholder="Filter by Role"
              style={{ width: '100%' }}
              allowClear
              value={filters.roleId}
              onChange={value => handleFilterChange('roleId', value)}
            >
              {Object.keys(ROLE_MAPPING).map(roleId => (
                <Option key={roleId} value={roleId}>
                  {roleId} - {ROLE_MAPPING[roleId].description}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} md={8}>
            <RangePicker 
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              value={filters.dateRange}
              onChange={dates => handleFilterChange('dateRange', dates)}
            />
          </Col>
          
          <Col xs={24} md={4}>
            <Space>
              <Button 
                type="primary"
                icon={<SearchOutlined />}
                onClick={applyFilters}
              >
                Apply
              </Button>
              <Button 
                onClick={resetFilters}
                icon={<ReloadOutlined />}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Divider style={{ margin: '16px 0 8px 0' }} />
        
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <FilterOutlined /> 
              <span>Showing {allocations.length} of {stats.total} allocations</span>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<FileExcelOutlined />} onClick={() => handleExport('excel')}>
                Export Excel
              </Button>
              <Button icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')}>
                Export PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
      
      {/* Data Table */}
      <Card className="role-allocation-card">
        <Table
          loading={loading}
          columns={columns}
          dataSource={allocations}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="key"
          className="allocations-table"
          bordered
          size="middle"
        />
      </Card>
      
      {/* Create New Button */}
      <Row justify="center" style={{ marginTop: 24 }}>
        <Button 
          type="primary" 
          size="large"
          icon={<ExportOutlined />}
          onClick={() => navigate('/role-allocation')}
        >
          Create New Allocation
        </Button>
      </Row>
    </motion.div>
  );
};

export default RoleAllocationsList; 