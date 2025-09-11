import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../services/axios';

function CancelOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({
    account_holder_name: '', // Đã sửa từ account_name
    bank_name: '',
    account_number: '',
    phone_number: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch order detail để tính 30%
  useEffect(() => {
    axios
      .get(`/orders/${id}`)
      .then((res) => {
        if (res.data?.data) {
          setOrder(res.data.data);
        }
      })
      .catch(() => {
        setError('Không thể tải thông tin đơn hàng');
      });
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    
    // Xóa lỗi validation khi người dùng bắt đầu nhập
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order) {
      setError('Không tìm thấy đơn hàng để hủy');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    try {
      const depositAmount = Math.round(Number(order.total_amount) * 0.3);

      const res = await axios.post(`/orders/${id}/request-cancel`, {
        account_holder_name: form.account_holder_name, // Đã sửa từ account_name
        bank_name: form.bank_name,
        account_number: form.account_number,
        phone_number: form.phone_number,
        amount: depositAmount,
      });

      if (res.data.success) {
        setSuccess('Yêu cầu hủy đã được gửi, vui lòng chờ admin xác nhận.');
        setTimeout(() => navigate('/my-orders'), 2000);
      } else {
        setError(res.data.message || 'Gửi yêu cầu hủy thất bại.');
      }
    } catch (err) {
      if (err.response?.status === 422) {
        // Xử lý lỗi validation từ server
        if (err.response.data.errors) {
          setValidationErrors(err.response.data.errors);
        }
        setError(err.response.data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Hủy đơn hàng #{id}</h2>

      {order && (
        <div style={{ marginBottom: '1rem' }}>
          <p>
            Tổng tiền đơn hàng:{' '}
            <b>{Number(order.total_amount).toLocaleString('vi-VN')} VND</b>
          </p>
          <p>
            Số tiền đặt cọc (30%):{' '}
            <b>
              {Math.round(Number(order.total_amount) * 0.3).toLocaleString(
                'vi-VN'
              )}{' '}
              VND
            </b>
          </p>
        </div>
      )}

      <p>Vui lòng nhập thông tin để hoàn tất yêu cầu hủy.</p>

      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '1rem', 
          padding: '0.75rem',
          backgroundColor: '#ffe6e6',
          border: '1px solid #ffcccc',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ 
          color: 'green', 
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#e6ffe6',
          border: '1px solid #ccffcc',
          borderRadius: '4px'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Tên đăng ký tài khoản</label>
          <input
            type="text"
            name="account_holder_name" // Đã sửa từ account_name
            value={form.account_holder_name} // Đã sửa từ account_name
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              border: validationErrors.account_holder_name ? '1px solid red' : '1px solid #ccc' // Đã sửa
            }}
          />
          {validationErrors.account_holder_name && ( // Đã sửa
            <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {validationErrors.account_holder_name} // Đã sửa
            </div>
          )}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Tên ngân hàng</label>
          <input
            type="text"
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              border: validationErrors.bank_name ? '1px solid red' : '1px solid #ccc'
            }}
          />
          {validationErrors.bank_name && (
            <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {validationErrors.bank_name}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Số tài khoản</label>
          <input
            type="text"
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              border: validationErrors.account_number ? '1px solid red' : '1px solid #ccc'
            }}
          />
          {validationErrors.account_number && (
            <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {validationErrors.account_number}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Số điện thoại</label>
          <input
            type="text"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              border: validationErrors.phone_number ? '1px solid red' : '1px solid #ccc'
            }}
          />
          {validationErrors.phone_number && (
            <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {validationErrors.phone_number}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#dc3545',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu hủy'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/my-orders')}
            style={{
              marginLeft: '0.5rem',
              background: 'gray',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Quay lại
          </button>
        </div>
      </form>
    </div>
  );
}

export default CancelOrderPage;