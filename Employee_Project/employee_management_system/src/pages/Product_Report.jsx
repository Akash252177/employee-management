import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Input, Button, Form, Row, Col, Table, Space, 
  Spin, Empty, message, Tabs, Modal, Typography, Skeleton,
  Badge, Alert, Tooltip, Drawer, Statistic, Breadcrumb, Divider, Tag,
  Dropdown
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined,
  DownloadOutlined, FileExcelOutlined, FilePdfOutlined,
  DashboardOutlined, TeamOutlined, AppstoreOutlined,
  InfoCircleOutlined, ArrowLeftOutlined, HomeOutlined,
  QuestionCircleOutlined, ToolOutlined, CheckCircleOutlined,
  FileTextOutlined, BulbOutlined, CalendarOutlined,
  UpOutlined, DownOutlined, WarningOutlined, PrinterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import './Product_Report.css';

const { Title, Text } = Typography;

// Helper function to create a properly configured jsPDF instance with autoTable
const createPdf = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  doc.autoTable = autoTable;
  
  return doc;
};

// Helper to add CSS class with a setTimeout to avoid blocking the main thread
const addClassWithDelay = (element, className, delay = 50) => {
  if (!element) return;
  setTimeout(() => {
    element.classList.add(className);
  }, delay);
};

// Helper to remove CSS class with a setTimeout to avoid blocking the main thread
const removeClassWithDelay = (element, className, delay = 50) => {
  if (!element) return;
  setTimeout(() => {
    element.classList.remove(className);
  }, delay);
};

const ProductReport = () => {
  const [form] = Form.useForm();
  const [productData, setProductData] = useState([]);
  const [clientData, setClientData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('product');
  const [fadeIn, setFadeIn] = useState(false);
  
  // States for detail views
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailType, setDetailType] = useState('');
  const [currentDetails, setCurrentDetails] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Animation states
  const [searchVisible, setSearchVisible] = useState(true);
  
  // Refs for GSAP animations
  const formCardRef = useRef(null);
  const headerRef = useRef(null);
  const searchCardRef = useRef(null);
  const resultsCardRef = useRef(null);
  const tableRef = useRef(null);
  const buttonsRef = useRef(null);
  const infoBannerRef = useRef(null);
  const breadcrumbRef = useRef(null);

  // Breadcrumb items configuration
  const breadcrumbItems = [
    {
      title: (
        <>
          <HomeOutlined /> Home
        </>
      ),
      href: '/'
    },
    {
      title: (
        <>
          <AppstoreOutlined /> Products
        </>
      ),
      href: '/products'
    },
    {
      title: 'Product Reports'
    }
  ];

  useEffect(() => {
    // Use simpler fade-in with CSS classes instead of heavy GSAP animations
    setTimeout(() => {
      setFadeIn(true);
      if (breadcrumbRef.current) breadcrumbRef.current.classList.add('fade-in');
      if (headerRef.current) headerRef.current.classList.add('slide-in-down');
      if (infoBannerRef.current) infoBannerRef.current.classList.add('fade-in');
      if (searchCardRef.current) searchCardRef.current.classList.add('slide-in-right');
      if (resultsCardRef.current) resultsCardRef.current.classList.add('slide-in-up');
      
      // Animate form items with CSS if search is visible
      if (searchVisible) {
        const formItems = document.querySelectorAll('.product-report-form-item');
        formItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('fade-in');
          }, 100 + (index * 50));
        });
        
        if (buttonsRef.current) {
          setTimeout(() => {
            buttonsRef.current.classList.add('fade-in');
          }, 300);
        }
      }
    }, 100);
  }, [searchVisible]);
  
  // Replace GSAP initializeAnimations with no-op as we're using CSS animations
  const initializeAnimations = () => {
    // Do nothing - using CSS animations instead
  };

  // Show success notification
  const showSuccessNotification = useCallback(() => {
    setShowSuccessMessage(true);
    
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  }, []);

  // Fetch data based on search criteria
  const handleFetch = useCallback((values) => {
    setLoading(true);
    const params = {};
    
    // Use CSS for animation instead of GSAP
    if (searchCardRef.current) {
      searchCardRef.current.classList.add('pulse-animation');
      setTimeout(() => {
        searchCardRef.current.classList.remove('pulse-animation');
      }, 600);
    }
    
    // Set which tab to display based on which search field is filled
    if (values.productId) {
      params.productId = values.productId;
      setActiveTab('product');
      fetchProductData(params);
    } else if (values.clientId) {
      params.clientId = values.clientId;
      setActiveTab('client');
      fetchClientData(params);
    } else if (values.projectId) {
      params.projectId = values.projectId;
      setActiveTab('project');
      fetchProjectData(params);
    } else {
      message.warning({
        content: 'Please enter at least one search criteria',
        style: { marginTop: '20px' },
      });
      
      // Error animation for empty form using CSS
      const formItems = document.querySelectorAll('.product-report-form-item');
      formItems.forEach(item => {
        item.classList.add('shake-animation');
        setTimeout(() => {
          item.classList.remove('shake-animation');
        }, 500);
      });
      
      setLoading(false);
    }
  }, []);

  // Fetch product data - optimized without GSAP animations
  const fetchProductData = useCallback((params) => {
    axios.get('http://127.0.0.1:5000/api/product-report', { params })
      .then(response => {
        setProductData(response.data || []);
        
        if (response.data?.length > 0) {
          message.success({
            content: `Found ${response.data.length} product records`,
            style: { marginTop: '20px' },
            className: 'success-message-animation'
          });
          
          showSuccessNotification();
          
          // Use CSS classes for animations instead of GSAP
          if (resultsCardRef.current) {
            resultsCardRef.current.classList.add('success-highlight');
            setTimeout(() => {
              resultsCardRef.current.classList.remove('success-highlight');
            }, 1500);
          }
          
          // Let CSS handle row animations with classes
          setTimeout(() => {
            document.querySelectorAll('.ant-table-row').forEach((row, index) => {
              setTimeout(() => {
                row.classList.add('row-appear');
              }, index * 30);
            });
          }, 100);
        } else {
          message.info({
            content: 'No products found matching your criteria',
            style: { marginTop: '20px' },
          });
        }
      })
      .catch(error => {
        console.error('Error fetching product data:', error);
        message.error({
          content: 'Failed to fetch product data. Please try again.',
          className: 'error-message-animation',
          duration: 5
        });
        
        // Use CSS for error animation
        if (resultsCardRef.current) {
          resultsCardRef.current.classList.add('shake-animation');
          setTimeout(() => {
            resultsCardRef.current.classList.remove('shake-animation');
          }, 500);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [showSuccessNotification]);

  // Optimized fetch client data without heavy animations
  const fetchClientData = useCallback((params) => {
    // Show loading state
    setLoading(true);
    
    // Create axios config with extended timeout and error handling
    const axiosConfig = { 
      params,
      timeout: 10000, // 10 second timeout
      withCredentials: false, // Disable credentials for simple CORS requests
      headers: {
        'Accept': 'application/json'
      }
    };
    
    axios.get('http://127.0.0.1:5000/api/client-report', axiosConfig)
      .then(response => {
        setClientData(response.data || []);
        
        if (response.data?.length > 0) {
          message.success({
            content: `Found ${response.data.length} client records`,
            style: { marginTop: '20px' },
            className: 'success-message-animation'
          });
          
          showSuccessNotification();
          
          // Use CSS classes for animations instead of GSAP
          if (resultsCardRef.current) {
            resultsCardRef.current.classList.add('success-highlight-green');
            setTimeout(() => {
              resultsCardRef.current.classList.remove('success-highlight-green');
            }, 1500);
          }
          
          // CSS-based row animation
          setTimeout(() => {
            document.querySelectorAll('.ant-table-row').forEach((row, index) => {
              setTimeout(() => {
                row.classList.add('row-appear');
              }, index * 30);
            });
          }, 100);
        } else {
          message.info({
            content: 'No clients found matching your criteria',
            style: { marginTop: '20px' },
          });
        }
      })
      .catch(error => {
        console.error('Error fetching client data:', error);
        
        // Show different error messages based on error type
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          message.error({
            content: `Server error: ${error.response.status} - ${error.response.data?.error || 'Failed to fetch data'}`,
            className: 'error-message-animation',
            duration: 5
          });
        } else if (error.request) {
          // The request was made but no response was received
          message.error({
            content: 'Network error: Could not connect to server. Please check your connection and try again.',
            className: 'error-message-animation',
            duration: 5
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          message.error({
            content: `Request error: ${error.message}`,
            className: 'error-message-animation',
            duration: 5
          });
        }
        
        // Use CSS for error animation
        if (resultsCardRef.current) {
          resultsCardRef.current.classList.add('shake-animation');
          setTimeout(() => {
            resultsCardRef.current.classList.remove('shake-animation');
          }, 500);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [showSuccessNotification]);

  // Optimized fetch project data without heavy animations
  const fetchProjectData = useCallback((params) => {
    axios.get('http://127.0.0.1:5000/api/project-report', { params })
      .then(response => {
        setProjectData(response.data || []);
        
        if (response.data?.length > 0) {
          message.success({
            content: `Found ${response.data.length} project records`,
            style: { marginTop: '20px' },
            className: 'success-message-animation'
          });
          
          // Use CSS classes for animations instead of GSAP
          if (resultsCardRef.current) {
            resultsCardRef.current.classList.add('success-highlight-purple');
            setTimeout(() => {
              resultsCardRef.current.classList.remove('success-highlight-purple');
            }, 1500);
          }
          
          // CSS-based row animation
          setTimeout(() => {
            document.querySelectorAll('.ant-table-row').forEach((row, index) => {
              setTimeout(() => {
                row.classList.add('row-appear');
              }, index * 30);
            });
          }, 100);
        } else {
          message.info({
            content: 'No projects found matching your criteria',
            style: { marginTop: '20px' },
          });
        }
      })
      .catch(error => {
        console.error('Error fetching project data:', error);
        message.error({
          content: 'Failed to fetch project data. Please try again.',
          className: 'error-message-animation',
          duration: 5
        });
        
        // Use CSS for error animation
        if (resultsCardRef.current) {
          resultsCardRef.current.classList.add('shake-animation');
          setTimeout(() => {
            resultsCardRef.current.classList.remove('shake-animation');
          }, 500);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleReset = useCallback(() => {
    // Add CSS class for reset animation
    const formItems = document.querySelectorAll('.product-report-form-item');
    formItems.forEach((item, index) => {
      item.classList.add('reset-highlight');
      setTimeout(() => {
        item.classList.remove('reset-highlight');
      }, 500 + (index * 50));
    });
    
    // Reset form data
    setTimeout(() => {
      form.resetFields();
      setProductData([]);
      setClientData([]);
      setProjectData([]);
      message.info('Form has been reset');
    }, 300);
  }, [form]);

  // View details functionality with optimized animations using CSS
  const handleViewDetails = useCallback((id, type) => {
    setDetailsLoading(true);
    setDetailType(type);
    
    // Use CSS for button animation
    const button = document.querySelector(`.${type}-view-btn-${id}`);
    if (button) {
      button.classList.add('pulse-button');
      setTimeout(() => {
        button.classList.remove('pulse-button');
      }, 600);
    }
    
    // Build the endpoint
    const endpoint = `http://127.0.0.1:5000/api/${type}/${id}`;
    
    axios.get(endpoint)
      .then(response => {
        setCurrentDetails(response.data);
        setDetailsVisible(true);
      })
      .catch(error => {
        console.error(`Error fetching ${type} details:`, error);
        message.error({
          content: `Failed to fetch ${type} details. Please try again.`,
          className: 'error-message-animation',
          duration: 5
        });
      })
      .finally(() => {
        setDetailsLoading(false);
      });
  }, []);

  // Function to generate PDF
  const generatePDF = useCallback((id, type) => {
    try {
      console.log(`Generating PDF for ${type} with ID: ${id}`);
      
      // Create new jsPDF instance using our helper
      const doc = createPdf();
      console.log("jsPDF instance created");
      
      // Verify that autoTable is available
      if (typeof doc.autoTable !== 'function') {
        console.error("autoTable is not available on the jsPDF instance!");
        console.log("Available methods:", Object.keys(doc));
        throw new Error("jspdf-autotable is not properly imported or initialized");
      }
      
      // Add title with proper parameters
      doc.setFontSize(20);
      doc.setTextColor(23, 54, 93);
      doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 105, 15, { align: 'center' });
      console.log("Title added");
      
      // Add subtitle with ID with proper parameters
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`ID: ${id} - Generated on ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
      
      // Add simple header instead of complex rounded rect
      doc.setDrawColor(24, 144, 255);
      doc.setFillColor(240, 247, 255);
      // Draw a simple rectangle instead of roundedRect
      doc.rect(14, 35, 182, 10, 'F');
      doc.setTextColor(24, 144, 255);
      doc.setFontSize(12);
      doc.text('Employee Management System - Product Reports', 20, 42);
      console.log("Header added");
      
      // Simplify fonts and colors before data processing
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      let dataForPDF = [];
      
      // Get data for the PDF based on type
      if (type === 'product') {
        console.log("Processing product data", productData);
        const productItem = productData.find(item => item.product_id === id);
        if (productItem) {
          console.log("Found product item:", productItem);
          // Transform data for PDF
          dataForPDF = [
            { field: 'Product ID', value: productItem.product_id },
            { field: 'Product Name', value: productItem.product_name },
            { field: 'Status', value: productItem.product_status },
            { field: 'Date of Product', value: productItem.date_of_product }
            // Add any other fields as needed
          ];
        } else {
          console.warn(`Product with ID ${id} not found in productData`);
        }
      } else if (type === 'client') {
        console.log("Processing client data", clientData);
        const clientItem = clientData.find(item => item.client_id === id);
        if (clientItem) {
          console.log("Found client item:", clientItem);
          // Transform data for PDF
          dataForPDF = [
            { field: 'Client ID', value: clientItem.client_id },
            { field: 'Client Name', value: clientItem.client_name },
            { field: 'Address', value: clientItem.client_address || 'N/A' },
            { field: 'Email', value: clientItem.communication_email || 'N/A' },
            { field: 'Mobile', value: clientItem.contact_mobile || 'N/A' }
            // Add any other fields as needed
          ];
        } else {
          console.warn(`Client with ID ${id} not found in clientData`);
        }
      } else if (type === 'project') {
        console.log("Processing project data", projectData);
        const projectItem = projectData.find(item => item.project_id === id);
        if (projectItem) {
          console.log("Found project item:", projectItem);
          // Transform data for PDF
          dataForPDF = [
            { field: 'Project ID', value: projectItem.project_id },
            { field: 'Project Name', value: projectItem.project_name },
            { field: 'Description', value: projectItem.description || 'N/A' },
            { field: 'Release Date', value: projectItem.release_date || 'N/A' },
            { field: 'Committed Date', value: projectItem.committed_date || 'N/A' },
            { field: 'Estimated Cost', value: `$${projectItem.estimated_cost}` || 'N/A' }
            // Add any other fields as needed
          ];
        } else {
          console.warn(`Project with ID ${id} not found in projectData`);
        }
      }
      
      // If we have data, create a table
      if (dataForPDF.length > 0) {
        console.log("Data for PDF:", dataForPDF);
        
        try {
          doc.autoTable({
            startY: 50,
            head: [['Field', 'Value']],
            body: dataForPDF.map(item => [item.field, item.value]),
            theme: 'striped',
            headStyles: { 
              fillColor: [24, 144, 255],
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [240, 247, 255]
            }
          });
          console.log("Table added successfully");
        } catch (tableError) {
          console.error("Error creating table:", tableError);
          throw tableError;
        }
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text(`Employee Management System - Generated on ${new Date().toLocaleString()}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
          doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 5, { align: 'center' });
        }
        console.log("Footer added");
        
        // Save PDF
        try {
          doc.save(`${type}_${id}_report.pdf`);
          console.log("PDF saved successfully");
          
          message.success({
            content: `${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded as PDF!`,
            style: { marginTop: '20px' },
            className: 'success-message-animation'
          });
        } catch (saveError) {
          console.error("Error saving PDF:", saveError);
          throw saveError;
        }
      } else {
        console.warn("No data available for PDF generation");
        message.error({
          content: `No data available to generate PDF.`,
          className: 'error-message-animation',
          duration: 5
        });
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      // Check for specific error types
      if (error.message && error.message.includes('autotable')) {
        console.error('This appears to be an issue with jspdf-autotable. Make sure it is properly imported.');
      }
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      message.error({
        content: `Failed to generate PDF: ${error.message}. Please check console for details.`,
        className: 'error-message-animation',
        duration: 8
      });
    } finally {
      setLoading(false);
    }
  }, [productData, clientData, projectData]);

  // Function to export all data as PDF
  const exportAllDataAsPDF = useCallback((type) => {
    try {
      setLoading(true);
      console.log(`Exporting all ${type} data as PDF`);
      
      // Create new jsPDF instance using our helper
      const doc = createPdf();
      console.log("jsPDF instance created for export all");
      
      // Verify that autoTable is available
      if (typeof doc.autoTable !== 'function') {
        console.error("autoTable is not available on the jsPDF instance for exportAll!");
        console.log("Available methods:", Object.keys(doc));
        throw new Error("jspdf-autotable is not properly imported or initialized");
      }
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(23, 54, 93);
      doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report - All Data`, 105, 15, { align: 'center' });
      
      // Add subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
      
      // Add logo/header
      doc.setDrawColor(24, 144, 255);
      doc.setFillColor(240, 247, 255);
      // Draw a simple rectangle instead of roundedRect
      doc.rect(14, 35, 182, 10, 'F');
      doc.setTextColor(24, 144, 255);
      doc.setFontSize(12);
      doc.text('Employee Management System - Product Reports', 20, 42);
      
      // Get data and columns based on type
      let dataForPDF = [];
      let headers = [];
      
      if (type === 'product') {
        headers = ['Product ID', 'Product Name', 'Status', 'Date of Product'];
        dataForPDF = productData.map(item => [
          item.product_id,
          item.product_name,
          item.product_status,
          item.date_of_product
        ]);
      } else if (type === 'client') {
        headers = ['Client ID', 'Client Name', 'Address', 'Email', 'Mobile'];
        dataForPDF = clientData.map(item => [
          item.client_id,
          item.client_name,
          item.client_address || 'N/A',
          item.communication_email || 'N/A',
          item.contact_mobile || 'N/A'
        ]);
      } else if (type === 'project') {
        headers = ['Project ID', 'Project Name', 'Description', 'Release Date', 'Committed Date', 'Est. Cost'];
        dataForPDF = projectData.map(item => [
          item.project_id,
          item.project_name,
          (item.description && item.description.length > 20) ? item.description.substring(0, 20) + '...' : (item.description || 'N/A'),
          item.release_date || 'N/A',
          item.committed_date || 'N/A',
          `$${item.estimated_cost}` || 'N/A'
        ]);
      }
      
      console.log(`Data for export: ${dataForPDF.length} rows`);
      
      // Create table if we have data
      if (dataForPDF.length > 0) {
        try {
          doc.autoTable({
            startY: 50,
            head: [headers],
            body: dataForPDF,
            theme: 'striped',
            headStyles: { 
              fillColor: [24, 144, 255],
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [240, 247, 255]
            }
          });
          console.log("Table added successfully for export all");
        } catch (tableError) {
          console.error("Error creating table for export all:", tableError);
          throw tableError;
        }
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text(`Employee Management System - Generated on ${new Date().toLocaleString()}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
          doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 5, { align: 'center' });
        }
        
        // Save PDF
        try {
          doc.save(`all_${type}_report.pdf`);
          console.log("Export all PDF saved successfully");
          
          message.success({
            content: `All ${type} data exported as PDF!`,
            style: { marginTop: '20px' },
            className: 'success-message-animation'
          });
        } catch (saveError) {
          console.error("Error saving export all PDF:", saveError);
          throw saveError;
        }
      } else {
        console.warn(`No ${type} data available for export`);
        message.error({
          content: `No ${type} data available to export.`,
          className: 'error-message-animation',
          duration: 5
        });
      }
    } catch (error) {
      console.error('PDF export all error:', error);
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      message.error({
        content: `Failed to generate PDF: ${error.message}. Please check console for details.`,
        className: 'error-message-animation',
        duration: 8
      });
    } finally {
      setLoading(false);
    }
  }, [productData, clientData, projectData]);
  
  // Handle download action with animations
  const handleDownload = useCallback((id, type) => {
    // Animation for download button - safely check if element exists first
    const animationTarget = document.querySelector(`.${type}-download-btn-${id}`);
    if (animationTarget) {
      gsap.to(animationTarget, {
        scale: 1.1,
        boxShadow: "0 0 10px rgba(82, 196, 26, 0.5)",
        duration: 0.3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1
      });
    }
    
    const downloadAction = (format) => {
      setLoading(true);
      
      // Debug info about the ID
      console.log(`Download requested for ${type} with ID: ${id} in format: ${format}`);
      
      // Ensure we're using the correct format for project ID
      let actualId = id;
      if (type === 'project' && !id.startsWith('PRO')) {
        // Try to find the project in projectData
        if (projectData && projectData.length > 0) {
          const project = projectData.find(p => p.project_id === id || p.project_id.includes(id.substring(1)));
          if (project) {
            actualId = project.project_id;
            console.log(`Found actual project ID: ${actualId} for input ID: ${id}`);
          }
        }
      }
      
      // Direct URL approach for downloads instead of axios
      const endpoint = `http://127.0.0.1:5000/api/${type}-download/${actualId}?format=${format}`;
      console.log(`Using endpoint: ${endpoint}`);
    
      if (format === 'pdf') {
        // Open in a new tab for PDF
        window.open(endpoint, '_blank');
        setLoading(false);
        message.success({
          content: `${type.charAt(0).toUpperCase() + type.slice(1)} report opened as PDF!`,
          style: { marginTop: '20px' },
          className: 'success-message-animation'
        });
        return;
      }
      
      // For CSV, direct link
      window.location.href = endpoint;
      
      setLoading(false);
      message.success({
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded as ${format.toUpperCase()}!`,
        style: { marginTop: '20px' },
        className: 'success-message-animation'
      });
    };

    Modal.confirm({
      title: 'Choose Download Format',
      content: 'Do you want to download as CSV or PDF?',
      icon: <DownloadOutlined />,
      okText: 'CSV',
      okButtonProps: { 
        icon: <FileExcelOutlined /> 
      },
      cancelText: 'PDF',
      cancelButtonProps: { 
        danger: false,
        icon: <FilePdfOutlined />
      },
      onOk: () => downloadAction('csv'),
      onCancel: () => downloadAction('pdf'),
    });
  }, [projectData]);

  // Utility function to download files
  const downloadFile = (endpoint, filename) => {
    setLoading(true);
      axios({
        url: endpoint,
        method: 'GET',
        responseType: 'blob',
      })
        .then(response => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
        link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          message.success({
          content: `File downloaded successfully!`,
            style: { marginTop: '20px' },
          className: 'success-message-animation'
          });
        })
        .catch(error => {
          console.error(`Download error:`, error);
        message.error({
          content: `Failed to download file.`,
          className: 'error-message-animation',
          duration: 5
        });
        })
        .finally(() => {
          setLoading(false);
        });
    };

  // Add this new function to download PDFs from the backend
  const downloadPdfFromBackend = (id, type) => {
    setLoading(true);
    console.log(`Downloading ${type} PDF from backend for ID: ${id}`);
    
    try {
      // Use the backend endpoint to generate the PDF
      const baseUrl = 'http://127.0.0.1:5000'; // Define base URL for clarity
      const endpoint = `${baseUrl}/api/${type}-download/${id}`;
      const url = new URL(endpoint);
      url.searchParams.append('format', 'pdf');
      
      console.log(`Opening PDF URL: ${url.toString()}`);
      
      // Open PDF in a new tab instead of using axios
      window.open(url.toString(), '_blank');
      
      message.success({
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} report opened as PDF!`,
        style: { marginTop: '20px' },
        className: 'success-message-animation'
      });
    } catch (error) {
      console.error('Error opening PDF:', error);
      message.error({
        content: `Failed to open PDF: ${error.message}`,
        className: 'error-message-animation',
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  };

  // Add this function to export all data as PDF from the backend
  const exportAllPdfFromBackend = useCallback((type) => {
    setLoading(true);
    console.log(`Exporting all ${type} data as PDF from backend`);
    
    try {
      // Create URL object for better parameter handling
      const baseUrl = 'http://127.0.0.1:5000';
      const url = new URL(`${baseUrl}/api/download-${type}-report/pdf`);
      const downloadUrl = url.toString();
      
      console.log(`Initiating download from: ${downloadUrl}`);
      
      // Create a temporary anchor element for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}_report.pdf`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      
      // Trigger click and cleanup
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      message.success({
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} PDF download initiated!`,
        style: { marginTop: '20px' },
        className: 'success-message-animation'
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      message.error({
        content: `Error downloading PDF: ${error.message}`,
        className: 'error-message-animation',
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Add this function to export all data as CSV from the backend
  const exportAllCsvFromBackend = useCallback((type) => {
    setLoading(true);
    console.log(`Exporting all ${type} data as CSV from backend`);
    
    // Use the backend endpoint without specific ID to get all records
    const endpoint = `http://127.0.0.1:5000/api/download-${type}-report/csv`;
    console.log(`Using CSV endpoint: ${endpoint}`);
    
    // Direct download for CSV
    window.location.href = endpoint;
    
    message.success({
      content: `All ${type} data downloaded as CSV!`,
      style: { marginTop: '20px' },
      className: 'success-message-animation'
    });
    
    setLoading(false);
  }, []);
  
  // Add this function to download a specific item as PDF from backend
  const downloadSpecificPdf = useCallback((id, type) => {
    setLoading(true);
    console.log(`Downloading specific ${type} PDF from backend for ID: ${id}`);
    
    try {
      // Create URL object for better parameter handling
      const baseUrl = 'http://127.0.0.1:5000';
      const url = new URL(`${baseUrl}/api/${type}-download/${id}`);
      url.searchParams.append('format', 'pdf');
      const downloadUrl = url.toString();
      
      console.log(`Initiating download from: ${downloadUrl}`);
      
      // Create a temporary anchor element for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}_${id}_report.pdf`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      
      // Trigger click and cleanup
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      message.success({
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} PDF download initiated!`,
        style: { marginTop: '20px' },
        className: 'success-message-animation'
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      message.error({
        content: `Error downloading PDF: ${error.message}`,
        className: 'error-message-animation',
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle search visibility with CSS animations instead of GSAP
  const toggleSearchVisibility = useCallback(() => {
    if (searchVisible) {
      // Use CSS for hiding search
      if (searchCardRef.current) {
        searchCardRef.current.classList.add('collapse-search');
        
        // Wait for animation to complete before updating state
        setTimeout(() => {
          setSearchVisible(false);
          searchCardRef.current.classList.remove('collapse-search');
        }, 300);
      }
    } else {
      // Show search and use CSS for animation
      setSearchVisible(true);
      
      // Wait for next frame to ensure the element is in DOM
      requestAnimationFrame(() => {
        if (searchCardRef.current) {
          searchCardRef.current.classList.add('expand-search');
          
          // Remove class after animation completes
          setTimeout(() => {
            searchCardRef.current.classList.remove('expand-search');
            
            // Animate form items and buttons with CSS
            const formItems = document.querySelectorAll('.product-report-form-item');
            formItems.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add('fade-in');
              }, 100 + (index * 50));
            });
            
            if (buttonsRef.current) {
              setTimeout(() => {
                buttonsRef.current.classList.add('fade-in');
              }, 300);
            }
          }, 400);
        }
      });
    }
  }, [searchVisible]);
  
  // Inside the ProductReport component, add a new method for rendering summary cards
  const renderSummaryCards = useCallback(() => {
    // Create empty arrays if data is undefined
    const products = productData || [];
    const clients = clientData || [];
    const projects = projectData || [];
    
    // Determine which data to show based on active tab
    let totalItems = 0;
    let statusCounts = {};
    let recentDate = null;
    
    if (activeTab === 'product') {
      totalItems = products.length;
      // Count products by status
      products.forEach(item => {
        statusCounts[item.product_status] = (statusCounts[item.product_status] || 0) + 1;
      });
      // Get most recent product date
      if (products.length > 0) {
        recentDate = products.reduce((latest, item) => {
          const current = new Date(item.date_of_product);
          return current > latest ? current : latest;
        }, new Date(0));
      }
    } else if (activeTab === 'client') {
      totalItems = clients.length;
      // Count clients by some criteria if available
      if (clients.length > 0) {
        recentDate = new Date(); // Use current date or another field if available
      }
    } else if (activeTab === 'project') {
      totalItems = projects.length;
      // Count projects by criteria if needed
      projects.forEach(item => {
        // Example: count by year of release date
        const year = item.release_date ? new Date(item.release_date).getFullYear() : 'Unknown';
        statusCounts[year] = (statusCounts[year] || 0) + 1;
      });
      // Get latest release date
      if (projects.length > 0) {
        recentDate = projects.reduce((latest, item) => {
          if (!item.release_date) return latest;
          const current = new Date(item.release_date);
          return current > latest ? current : latest;
        }, new Date(0));
      }
    }
    
    // Convert statusCounts to array for rendering
    const statusItems = Object.entries(statusCounts).map(([key, value]) => ({
      name: key,
      value: value,
    }));
    
    return (
      <div className="product-report-summary-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card className="product-report-summary-card total-card">
              <Statistic
                title={
                  <div className="product-report-summary-title">
                    <FileTextOutlined /> Total {activeTab === 'product' ? 'Products' : activeTab === 'client' ? 'Clients' : 'Projects'}
                  </div>
                }
                value={totalItems}
                valueStyle={{ color: '#1890ff' }}
                prefix={<Badge status="processing" />}
              />
              {totalItems > 0 && (
                <div className="product-report-summary-footer">
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: '1',
                          label: 'Export as PDF',
                          icon: <FilePdfOutlined />,
                          onClick: () => exportAllPdfFromBackend(activeTab)
                        },
                        {
                          key: '2',
                          label: 'Export as CSV',
                          icon: <FileExcelOutlined />,
                          onClick: () => exportAllCsvFromBackend(activeTab)
                        }
                      ]
                    }}
                    placement="bottomRight"
                  >
                    <Button type="link" size="small">
                      <Space>
                        <DownloadOutlined />
                        Export All
                        <DownOutlined />
                      </Space>
                    </Button>
                  </Dropdown>
                </div>
              )}
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card className="product-report-summary-card status-card">
              <div className="product-report-summary-title">
                <CheckCircleOutlined /> Status Distribution
              </div>
              {statusItems.length > 0 ? (
                <div className="product-report-status-list">
                  {statusItems.map((item, index) => (
                    <div key={index} className="product-report-status-item">
                      <Tag 
                        color={
                          item.name === 'Active' ? 'success' :
                          item.name === 'Inactive' ? 'warning' :
                          item.name === '2025' ? 'blue' :
                          item.name === '2026' ? 'purple' :
                          'default'
                        }
                      >
                        {item.name}
                      </Tag>
                      <span className="product-report-status-count">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available" />
              )}
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card className="product-report-summary-card date-card">
              <div className="product-report-summary-title">
                <CalendarOutlined /> Latest Update
              </div>
              {recentDate && recentDate.getTime() > new Date(0).getTime() ? (
                <div className="product-report-date-info">
                  <div className="product-report-recent-date">
                    {recentDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="product-report-date-ago">
                    {Math.floor((new Date() - recentDate) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No date information" />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  }, [activeTab, productData, clientData, projectData]);

  // Replace the existing Product table columns with this enhanced version
  const productColumns = [
    {
      title: 'Product ID',
      dataIndex: 'product_id',
      key: 'product_id',
      render: (id) => (
        <Badge color="blue" text={id} className="product-report-table-badge" />
      )
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'product_status',
      key: 'product_status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'success' : 'warning'} className="product-report-table-tag">
          {status === 'Active' ? <CheckCircleOutlined /> : <WarningOutlined />} {status}
        </Tag>
      ),
    },
    {
      title: 'Date of Product',
      dataIndex: 'date_of_product',
      key: 'date_of_product',
      render: (date) => (
        <div className="product-report-table-date">
          <CalendarOutlined /> {date}
          <span className="product-report-date-ago">
            {Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))} days ago
          </span>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle" className="product-report-action-buttons">
            <Button 
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.product_id, 'product')}
            className={`product-view-btn-${record.product_id} product-report-view-button`}
            >
              View
            </Button>
        </Space>
      )
    }
  ];

  // Client table columns
  const clientColumns = [
    {
      title: 'Client ID',
      dataIndex: 'client_id',
      key: 'client_id',
      render: (id) => (
        <Badge color="green" text={id} className="product-report-table-badge" />
      )
    },
    {
      title: 'Client Name',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Address',
      dataIndex: 'client_address',
      key: 'client_address',
      ellipsis: true,
      render: (text) => text || 'N/A'
    },
    {
      title: 'Email',
      dataIndex: 'communication_email',
      key: 'communication_email',
      render: (email) => email || 'N/A'
    },
    {
      title: 'Mobile',
      dataIndex: 'contact_mobile',
      key: 'contact_mobile',
      render: (phone) => phone || 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle" className="product-report-action-buttons">
            <Button 
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.client_id, 'client')}
            className={`client-view-btn-${record.client_id}`}
            >
              View
            </Button>
        </Space>
      )
    }
  ];

  // Project table columns
  const projectColumns = [
    {
      title: 'Project ID',
      dataIndex: 'project_id',
      key: 'project_id',
      render: (id) => (
        <Badge color="purple" text={id} className="product-report-table-badge" />
      )
    },
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || 'N/A'
    },
    {
      title: 'Release Date',
      dataIndex: 'release_date',
      key: 'release_date',
      render: (date) => (
        <div className="product-report-table-date">
          <CalendarOutlined /> {date || 'N/A'}
          {date && (
            <span className="product-report-date-ago">
              {Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24))} days ago
            </span>
          )}
        </div>
      )
    },
    {
      title: 'Estimated Cost',
      dataIndex: 'estimated_cost',
      key: 'estimated_cost',
      render: (cost) => (
        <Text type="success">${cost}</Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle" className="product-report-action-buttons">
            <Button 
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.project_id, 'project')}
            className={`project-view-btn-${record.project_id}`}
            >
              View
            </Button>
        </Space>
      )
    }
  ];

  // Now define tabItems after both column definitions
  const tabItems = [
    {
      key: 'product',
      label: (
        <span className="product-report-tab-label">
          <AppstoreOutlined />
          Product Data
          {productData && productData.length > 0 && (
            <Badge count={productData.length} className="product-report-tab-badge" />
          )}
        </span>
      ),
      children: loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : productData.length > 0 ? (
        <div ref={tableRef}>
          {renderSummaryCards()}
          <div className="product-report-table-header">
            <div className="product-report-table-title">
              <AppstoreOutlined /> Product Listing
            </div>
            <div className="product-report-table-actions">
            <Button 
                icon={<ReloadOutlined />} 
                onClick={() => handleFetch(form.getFieldsValue())}
                className="product-report-refresh-table-button"
              />
              <Dropdown
                menu={{
                  items: [
                    {
                      key: '1',
                      label: 'Export as CSV',
                      icon: <FileExcelOutlined />,
                      onClick: () => exportAllCsvFromBackend('product')
                    },
                    {
                      key: '2',
                      label: 'Export as PDF',
                      icon: <FilePdfOutlined />,
                      onClick: () => exportAllPdfFromBackend('product')
                    },
                    {
                      key: '3',
                      label: 'Print report',
                      icon: <PrinterOutlined />,
                      onClick: () => {
                        message.info('Preparing to print...');
                        setTimeout(() => {
                          window.print();
                        }, 500);
                      }
                    }
                  ]
                }}
                trigger={['click']}
              >
                <Button icon={<DownloadOutlined />}>
                  Export Options <DownOutlined />
            </Button>
              </Dropdown>
            </div>
          </div>
          <Table 
            dataSource={productData} 
            columns={productColumns} 
            pagination={{ 
              pageSize: 10,
              showTotal: (total) => `Total ${total} products`,
              showSizeChanger: false
            }} 
            rowKey="product_id"
            rowClassName={(record, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
            style={{ background: 'white' }}
            className="product-report-data-table"
            summary={pageData => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <div className="product-report-table-summary">
                      <Text type="secondary">Updated {new Date().toLocaleDateString()}</Text>
                      <Text strong>Total Products: {productData.length}</Text>
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>
      ) : (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="product-report-empty-container">
              <p className="product-report-empty-title">No Product Data Found</p>
              <p className="product-report-empty-description">
                Enter a Product ID in the search form above to retrieve product information.
              </p>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={() => {
                  // Scroll to search form
                  window.scrollTo({
                    top: searchCardRef.current.offsetTop - 20,
                    behavior: 'smooth'
                  });
                  
                  // Highlight the search form with animation
                  gsap.fromTo(
                    searchCardRef.current,
                    { boxShadow: "0 0 0 2px rgba(24, 144, 255, 0.3)" },
                    { 
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                      duration: 1.5,
                      ease: "elastic.out(1, 0.5)"
                    }
                  );
                }}
              >
                Go to Search
              </Button>
            </div>
          }
        />
      )
    },
    {
      key: 'client',
      label: (
        <span className="product-report-tab-label">
          <TeamOutlined />
          Client Data
          {clientData && clientData.length > 0 && (
            <Badge count={clientData.length} className="product-report-tab-badge" />
          )}
        </span>
      ),
      children: loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : clientData.length > 0 ? (
        <div ref={tableRef}>
          {renderSummaryCards()}
          <div className="product-report-table-header">
            <div className="product-report-table-title">
              <TeamOutlined /> Client Listing
            </div>
            <div className="product-report-table-actions">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => handleFetch(form.getFieldsValue())}
                className="product-report-refresh-table-button"
              />
              <Dropdown
                menu={{
                  items: [
                    {
                      key: '1',
                      label: 'Export as CSV',
                      icon: <FileExcelOutlined />,
                      onClick: () => exportAllCsvFromBackend('client')
                    },
                    {
                      key: '2',
                      label: 'Export as PDF',
                      icon: <FilePdfOutlined />,
                      onClick: () => exportAllPdfFromBackend('client')
                    },
                    {
                      key: '3',
                      label: 'Print report',
                      icon: <PrinterOutlined />,
                      onClick: () => {
                        message.info('Preparing to print...');
                        setTimeout(() => {
                          window.print();
                        }, 500);
                      }
                    }
                  ]
                }}
                trigger={['click']}
              >
                <Button icon={<DownloadOutlined />}>
                  Export Options <DownOutlined />
                </Button>
              </Dropdown>
            </div>
          </div>
          <Table 
            dataSource={clientData} 
            columns={clientColumns} 
            pagination={{ 
              pageSize: 10,
              showTotal: (total) => `Total ${total} clients`,
              showSizeChanger: false
            }} 
            rowKey="client_id"
            rowClassName={(record, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
            style={{ background: 'white' }}
            className="product-report-data-table"
            summary={pageData => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <div className="product-report-table-summary">
                      <Text type="secondary">Updated {new Date().toLocaleDateString()}</Text>
                      <Text strong>Total Clients: {clientData.length}</Text>
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>
      ) : (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="product-report-empty-container">
              <p className="product-report-empty-title">No Client Data Found</p>
              <p className="product-report-empty-description">
                Enter a Client ID in the search form above to retrieve client information.
              </p>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={() => {
                  // Scroll to search form
                  window.scrollTo({
                    top: searchCardRef.current.offsetTop - 20,
                    behavior: 'smooth'
                  });
                  
                  // Highlight the search form with animation
                  gsap.fromTo(
                    searchCardRef.current,
                    { boxShadow: "0 0 0 2px rgba(82, 196, 26, 0.3)" },
                    { 
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                      duration: 1.5,
                      ease: "elastic.out(1, 0.5)"
                    }
                  );
                }}
              >
                Go to Search
              </Button>
            </div>
          }
        />
      )
    },
    {
      key: 'project',
      label: (
        <span className="product-report-tab-label">
          <DashboardOutlined />
          Project Data
          {projectData && projectData.length > 0 && (
            <Badge count={projectData.length} className="product-report-tab-badge" />
          )}
        </span>
      ),
      children: loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : projectData.length > 0 ? (
        <div ref={tableRef}>
          {renderSummaryCards()}
          <div className="product-report-table-header">
            <div className="product-report-table-title">
              <DashboardOutlined /> Project Listing
            </div>
            <div className="product-report-table-actions">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => handleFetch(form.getFieldsValue())}
                className="product-report-refresh-table-button"
              />
              <Dropdown
                menu={{
                  items: [
                    {
                      key: '1',
                      label: 'Export as CSV',
                      icon: <FileExcelOutlined />,
                      onClick: () => exportAllCsvFromBackend('project')
                    },
                    {
                      key: '2',
                      label: 'Export as PDF',
                      icon: <FilePdfOutlined />,
                      onClick: () => exportAllPdfFromBackend('project')
                    },
                    {
                      key: '3',
                      label: 'Print report',
                      icon: <PrinterOutlined />,
                      onClick: () => {
                        message.info('Preparing to print...');
                        setTimeout(() => {
                          window.print();
                        }, 500);
                      }
                    }
                  ]
                }}
                trigger={['click']}
              >
                <Button icon={<DownloadOutlined />}>
                  Export Options <DownOutlined />
                </Button>
              </Dropdown>
            </div>
          </div>
          <Table 
            dataSource={projectData} 
            columns={projectColumns} 
            pagination={{ 
              pageSize: 10,
              showTotal: (total) => `Total ${total} projects`,
              showSizeChanger: false
            }} 
            rowKey="project_id"
            rowClassName={(record, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
            style={{ background: 'white' }}
            className="product-report-data-table"
            summary={pageData => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <div className="product-report-table-summary">
                      <Text type="secondary">Updated {new Date().toLocaleDateString()}</Text>
                      <Text strong>Total Projects: {projectData.length}</Text>
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>
      ) : (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="product-report-empty-container">
              <p className="product-report-empty-title">No Project Data Found</p>
              <p className="product-report-empty-description">
                Enter a Project ID in the search form above to retrieve project information.
              </p>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={() => {
                  // Scroll to search form
                  window.scrollTo({
                    top: searchCardRef.current.offsetTop - 20,
                    behavior: 'smooth'
                  });
                  
                  // Highlight the search form with animation
                  gsap.fromTo(
                    searchCardRef.current,
                    { boxShadow: "0 0 0 2px rgba(114, 46, 209, 0.3)" },
                    { 
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                      duration: 1.5,
                      ease: "elastic.out(1, 0.5)"
                    }
                  );
                }}
              >
                Go to Search
              </Button>
            </div>
          }
        />
      )
    }
  ];

  // Render detail view based on detail type
  const renderDetailView = () => {
    if (!currentDetails) return <Empty description="No details found" />;

    let content = null;
    
    switch(detailType) {
      case 'product':
        content = (
          <div className="detail-content">
            <Alert
              message={`Product: ${currentDetails.product_name}`}
              description={currentDetails.product_description}
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            
            <div className="product-report-role-info-header">
              <div className="product-report-role-icon"><InfoCircleOutlined /></div>
              <span className="product-report-role-info-title">Basic Information</span>
            </div>
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card 
                  title="Product Details" 
                  variant="borderless"
                  className="product-report-detail-card"
                >
                  <p><strong>Product ID:</strong> <Badge color="blue" text={currentDetails.product_id} /></p>
                  <p><strong>Date of Product:</strong> {currentDetails.date_of_product}</p>
                  <p><strong>Status:</strong> <Badge status={currentDetails.product_status === 'Active' ? 'success' : 'warning'} text={currentDetails.product_status} /></p>
                  <p><strong>Framework:</strong> <Tag color="blue">{currentDetails.product_framework}</Tag></p>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  title="Technical Details" 
                  variant="borderless"
                  className="product-report-detail-card"
                >
                  <p>{currentDetails.product_technical}</p>
                </Card>
              </Col>
            </Row>
            
            <div className="product-report-role-info-header" style={{ marginTop: '24px' }}>
              <div className="product-report-role-icon"><ToolOutlined /></div>
              <span className="product-report-role-info-title">Specifications</span>
            </div>
            
            <Card 
              variant="borderless"
              className="product-report-detail-card"
            >
              <p>{currentDetails.product_specification}</p>
            </Card>
            
            <Divider className="product-report-section-divider" />
            
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Text type="secondary">Created At: {currentDetails.created_at}</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text type="secondary">Updated At: {currentDetails.updated_at}</Text>
              </Col>
            </Row>
          </div>
        );
        break;
        
      case 'client':
        content = (
          <div className="detail-content">
            <Alert
              message={`Client: ${currentDetails.client_name}`}
              description={currentDetails.client_description || 'No description available'}
              type="success"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            
            <div className="product-report-role-info-header">
              <div className="product-report-role-icon"><TeamOutlined /></div>
              <span className="product-report-role-info-title">Client Information</span>
            </div>
            
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card 
                  title="Basic Information" 
                  variant="borderless"
                  className="product-report-detail-card"
                >
                  <p><strong>Client ID:</strong> <Badge color="green" text={currentDetails.client_id} /></p>
                  <p><strong>Address:</strong> {currentDetails.client_address || 'Not provided'}</p>
                </Card>
              </Col>
            </Row>
            
            <div className="product-report-role-info-header" style={{ marginTop: '24px' }}>
              <div className="product-report-role-icon"><InfoCircleOutlined /></div>
              <span className="product-report-role-info-title">Contact Details</span>
            </div>
            
            <Card 
              variant="borderless"
              className="product-report-detail-card"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <p><strong>Contact Name:</strong> {currentDetails.contact_name}</p>
                  <p><strong>Designation:</strong> {currentDetails.contact_designation || 'Not specified'}</p>
                  <p><strong>Mobile:</strong> {currentDetails.contact_mobile}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Email:</strong> {currentDetails.contact_email}</p>
                  <p><strong>Communication Email:</strong> {currentDetails.communication_email}</p>
                  <p><strong>Reporting To:</strong> {currentDetails.reporting_to}</p>
                </Col>
              </Row>
            </Card>
            
            <Divider className="product-report-section-divider" />
            
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Text type="secondary">Created At: {currentDetails.created_at}</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text type="secondary">Updated At: {currentDetails.updated_at}</Text>
              </Col>
            </Row>
          </div>
        );
        break;
        
      case 'project':
        content = (
          <div className="detail-content">
            <Alert
              message={`Project: ${currentDetails.project_name}`}
              description={currentDetails.description || 'No description available'}
              type="warning"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            
            <div className="product-report-role-info-header">
              <div className="product-report-role-icon"><DashboardOutlined /></div>
              <span className="product-report-role-info-title">Project Information</span>
            </div>
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card 
                  title="Project Details" 
                  variant="borderless"
                  className="product-report-detail-card"
                >
                  <p><strong>Project ID:</strong> <Badge color="purple" text={currentDetails.project_id} /></p>
                  <p><strong>Managed By:</strong> {currentDetails.managed_by}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  title="Associated With" 
                  variant="borderless"
                  className="product-report-detail-card"
                >
                  <p><strong>Client:</strong> <Badge color="green" text={`${currentDetails.client_name} (${currentDetails.project_client_id})`} /></p>
                  <p><strong>Product:</strong> <Badge color="blue" text={`${currentDetails.product_name} (${currentDetails.product_id})`} /></p>
                </Card>
              </Col>
            </Row>
            
            <div className="product-report-role-info-header" style={{ marginTop: '24px' }}>
              <div className="product-report-role-icon"><CalendarOutlined /></div>
              <span className="product-report-role-info-title">Timeline & Cost</span>
            </div>
            
            <Card 
              variant="borderless"
              className="product-report-detail-card"
            >
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic 
                    title="Estimated Cost" 
                    value={currentDetails.estimated_cost} 
                    prefix="$" 
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="Completion Days" 
                    value={currentDetails.completion_days}
                    suffix="days" 
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="Release Date" 
                    value={currentDetails.release_date}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="Committed Date" 
                    value={currentDetails.committed_date} 
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
              </Row>
            </Card>
            
            <Divider className="product-report-section-divider" />
            
            <Row style={{ marginTop: '16px' }}>
              <Col span={24}>
                <Text type="secondary">Created At: {currentDetails.created_at}</Text>
              </Col>
            </Row>
          </div>
        );
        break;
        
      default:
        content = <Empty description="No data available" />;
        break;
    }
    
    return content;
  };

  // Effect for drawer animation using CSS instead of GSAP
  useEffect(() => {
    if (detailsVisible && !detailsLoading) {
      // Animate detail content entry with CSS
      const detailElements = document.querySelectorAll('.detail-content > *');
      detailElements.forEach((element, index) => {
        setTimeout(() => {
          element.classList.add('fade-in-up');
        }, 200 + (index * 50));
      });
    }
  }, [detailsVisible, detailsLoading, currentDetails]);

  const getTabIcon = (tabKey) => {
    switch(tabKey) {
      case 'product':
        return <AppstoreOutlined />;
      case 'client':
        return <TeamOutlined />;
      case 'project':
        return <DashboardOutlined />;
      default:
        return null;
    }
  };

  // Tab change with CSS animation instead of GSAP
  const handleTabChange = useCallback((activeKey) => {
    // Use CSS for tab transitions
    if (tableRef.current) {
      tableRef.current.classList.add('fade-out');
      
      // Wait for fade-out to complete
      setTimeout(() => {
        setActiveTab(activeKey);
        
        // After state is updated, fade in the new content
        requestAnimationFrame(() => {
          if (tableRef.current) {
            tableRef.current.classList.remove('fade-out');
            tableRef.current.classList.add('fade-in');
            
            // Remove the animation class after it completes
            setTimeout(() => {
              if (tableRef.current) {
                tableRef.current.classList.remove('fade-in');
              }
            }, 300);
          }
        });
      }, 200);
    } else {
      // If no tableRef, just update the state directly
      setActiveTab(activeKey);
    }
  }, []);

  return (
    <div className="product-report-container">
      {/* Breadcrumb Navigation */}
      <div className="product-report-page-breadcrumb" ref={breadcrumbRef}>
        <Breadcrumb
          items={breadcrumbItems}
        />
      </div>
      
      {/* Header */}
      <div className="product-report-status-header" ref={headerRef}>
        <div className="product-report-header-icon-container">
          <AppstoreOutlined className="product-report-header-icon" />
        </div>
        <div className="product-report-header-content">
          <span className="product-report-header-text">Product Report Dashboard</span>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="product-report-success-notification">
          <div className="product-report-success-icon-wrapper">
            <CheckCircleOutlined className="product-report-success-icon" />
          </div>
          <span>Data fetched successfully!</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="product-report-info-banner" ref={infoBannerRef}>
        <InfoCircleOutlined className="product-report-info-banner-icon" />
        <div>
          <div className="product-report-info-banner-title">Generate Reports</div>
          <div className="product-report-info-banner-description">
            Enter a Product ID, Client ID, or Project ID to fetch and display relevant data.
            Use the search form below to retrieve information.
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="product-report-card" ref={searchCardRef}>
        <Form form={form} layout="vertical" onFinish={handleFetch}>
          <div className="product-report-role-info-header">
            <div className="product-report-role-icon"><SearchOutlined /></div>
            <span className="product-report-role-info-title">Search Criteria</span>
              <Button 
                type="text" 
              icon={searchVisible ? <UpOutlined /> : <DownOutlined />} 
              onClick={toggleSearchVisibility}
              className="product-report-toggle-button"
              />
          </div>
          
          {searchVisible && (
            <>
              <div className="product-report-search-intro">
                Enter one of the following IDs to retrieve data. Only one field is required.
              </div>
              
              <Row gutter={24}>
                <Col xs={24} sm={8}>
                  <Form.Item 
                    className="product-report-form-item"
                    label={
                      <div className="product-report-form-label">
                        <AppstoreOutlined />
                        <span>Product ID</span>
                        <QuestionCircleOutlined className="product-report-form-help-icon" />
                      </div>
                    } 
                    name="productId"
                  >
                    <Input 
                      placeholder="Enter Product ID" 
                      className="product-report-custom-input"
                      prefix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item 
                    className="product-report-form-item"
                    label={
                      <div className="product-report-form-label">
                        <TeamOutlined />
                        <span>Client ID</span>
                        <QuestionCircleOutlined className="product-report-form-help-icon" />
                      </div>
                    } 
                    name="clientId"
                  >
                    <Input 
                      placeholder="Enter Client ID" 
                      className="product-report-custom-input"
                      prefix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item 
                    className="product-report-form-item"
                    label={
                      <div className="product-report-form-label">
                        <DashboardOutlined />
                        <span>Project ID</span>
                        <QuestionCircleOutlined className="product-report-form-help-icon" />
                      </div>
                    } 
                    name="projectId"
                  >
                    <Input 
                      placeholder="Enter Project ID" 
                      className="product-report-custom-input"
                      prefix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <div className="product-report-button-container" ref={buttonsRef}>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleReset}
                  disabled={loading}
                  title="Reset all form fields"
                  className="product-report-reset-button"
                  >
                    Reset
                  </Button>
                <Button 
                  type="primary"
                  icon={loading ? <span className="product-report-loading-icon"></span> : <SearchOutlined />}
                  htmlType="submit"
                  disabled={loading}
                  title="Search for data"
                  className="product-report-search-button"
                >
                  Fetch Data
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>

      {/* Results Tabs and Tables */}
      <div className="product-report-card product-report-results-card" ref={resultsCardRef}>
        <div className="product-report-role-info-header">
          <div className="product-report-role-icon"><FileTextOutlined /></div>
          <span className="product-report-role-info-title">Results</span>
          <div className="product-report-results-controls">
            <Badge count={(productData.length || clientData.length || projectData.length) || 0} showZero />
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={() => handleFetch(form.getFieldsValue())}
              disabled={loading}
              className="product-report-refresh-button"
            />
          </div>
        </div>
        
        <div className="product-report-technical-section-intro">
          <BulbOutlined className="product-report-tech-intro-icon" />
          <Text>View and analyze data from your products, clients, and projects. Select a tab to switch between different data types.</Text>
        </div>

          <Spin spinning={loading} size="large" tip="Loading data...">
            <Tabs 
              activeKey={activeTab} 
            onChange={handleTabChange}
            type="card"
            className="product-report-tabs"
            tabBarExtraContent={
              <div className="product-report-export-options">
                {(productData.length > 0 || clientData.length > 0 || projectData.length > 0) && (
                  <Space>
                    {/* Red badge removed */}
                  </Space>
                )}
              </div>
            }
              items={tabItems}
            />
          </Spin>
      </div>

      {/* Footer */}
      <div className="product-report-page-footer">
        <div className="product-report-footer-content">
          <div className="product-report-footer-left">
            <span className="product-report-footer-title">Employee Management System</span>
            <span className="product-report-footer-subtitle">Product Reporting Module</span>
          </div>
          <div className="product-report-footer-right">
            <Button type="text" icon={<QuestionCircleOutlined />} className="product-report-help-button">Help</Button>
            <Button type="text" icon={<PrinterOutlined />} className="product-report-help-button">Print</Button>
            <Button type="link" href="/dashboard" icon={<HomeOutlined />} className="product-report-dashboard-button">
              Dashboard
            </Button>
          </div>
        </div>
        <div className="product-report-footer-note">
          <InfoCircleOutlined /> Report data is refreshed every 24 hours. Last updated: {new Date().toLocaleDateString()}.
        </div>
      </div>

      {/* Details Drawer */}
      <Drawer
        title={
          <Space className="product-report-drawer-title">
            {getTabIcon(detailType)}
            <span style={{ textTransform: 'capitalize' }}>{detailType} Details</span>
          </Space>
        }
        placement="right"
        closable={true}
        onClose={() => setDetailsVisible(false)}
        open={detailsVisible}
        width={800}
        className="product-report-details-drawer"
        extra={
          <Space>
            <Button 
              onClick={() => setDetailsVisible(false)} 
              icon={<ArrowLeftOutlined />}
            >
              Back
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => {
                // Extract the correct ID based on detail type
                let id = null;
                if (detailType === 'product') {
                  id = currentDetails?.product_id;
                } else if (detailType === 'client') {
                  id = currentDetails?.client_id;
                } else if (detailType === 'project') {
                  id = currentDetails?.project_id;
                  // Debug the project ID to ensure we're using the correct format
                  console.log(`PROJECT DETAIL EXPORT - using ID: ${id}`);
                }
                
                if (!id) {
                  message.error("Unable to determine ID for export");
                  return;
                }
                
                Modal.confirm({
                  title: 'Choose Download Format',
                  content: 'Do you want to download as CSV or PDF?',
                  icon: <DownloadOutlined />,
                  okText: 'CSV',
                  okButtonProps: { 
                    icon: <FileExcelOutlined /> 
                  },
                  cancelText: 'PDF',
                  cancelButtonProps: { 
                    danger: false,
                    icon: <FilePdfOutlined />
                  },
                  onOk: () => {
                    // Download as CSV
                    const endpoint = `http://127.0.0.1:5000/api/${detailType}-download/${id}?format=csv`;
                    console.log(`Downloading CSV using endpoint: ${endpoint}`);
                    window.location.href = endpoint;
                    message.success({
                      content: `${detailType.charAt(0).toUpperCase() + detailType.slice(1)} report downloaded as CSV!`,
                      style: { marginTop: '20px' },
                      className: 'success-message-animation'
                    });
                  },
                  onCancel: () => {
                    // Open as PDF
                    const endpoint = `http://127.0.0.1:5000/api/${detailType}-download/${id}?format=pdf`;
                    console.log(`Opening PDF using endpoint: ${endpoint}`);
                    window.open(endpoint, '_blank');
                    message.success({
                      content: `${detailType.charAt(0).toUpperCase() + detailType.slice(1)} report opened as PDF!`,
                      style: { marginTop: '20px' },
                      className: 'success-message-animation'
                    });
                  }
                });
              }}
            >
              Export
            </Button>
          </Space>
        }
      >
        <Spin spinning={detailsLoading} size="large">
          {renderDetailView()}
        </Spin>
      </Drawer>
    </div>
  );
};

export default ProductReport;