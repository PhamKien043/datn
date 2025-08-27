import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./menu-modern.css";

const VND = (n = 0) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0);

const Menu = () => {
  // ---- Search states ----
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // ---- Category & menus states ----
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [menusByCategory, setMenusByCategory] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular"); // 'popular' | 'price_asc' | 'price_desc' | 'name_asc'

  const userId = 1;

  // ---- Search API (server-side) ----
  const searchMenus = useCallback(async (keyword) => {
    if (!keyword || keyword.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    try {
      setIsSearching(true);
      const res = await axios.get(`http://localhost:8000/api/menus/search`, {
        params: { q: keyword.trim(), limit: 50 },
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setSearchResults(list);
    } catch (e) {
      console.error("Search error:", e);
      toast.error(e.response?.data?.message || "Tìm kiếm thất bại");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ---- Fetch: Menus by category ----
  const fetchMenusByCategory = useCallback(async (categoryId) => {
    setIsLoadingMenus(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/menus?category_id=${categoryId}`);
      const menusData = res.data?.data || [];
      setMenusByCategory((prev) => ({ ...prev, [categoryId]: menusData }));
      if (menusData.length === 0) toast.info("Không có món ăn nào trong danh mục này");
    } catch (error) {
      console.error("Lỗi khi tải món ăn:", error);
      toast.error(`Lỗi khi tải món ăn: ${error.response?.data?.message || error.message}`);
      setMenusByCategory((prev) => ({ ...prev, [categoryId]: [] }));
    } finally {
      setIsLoadingMenus(false);
    }
  }, []);

  // ---- Fetch: Categories ----
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const res = await axios.get("http://localhost:8000/api/category-menus");
      const list = Array.isArray(res.data) ? res.data : [];
      setCategories(list);

      if (list.length > 0) {
        const firstId = list[0].id;
        setActiveCategory(firstId);
        await fetchMenusByCategory(firstId);
      } else {
        toast.warn("Không có danh mục món ăn nào trong hệ thống");
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
      toast.error(`Lỗi khi tải danh mục: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [fetchMenusByCategory]);

  // ---- Fetch: Selected room from cart ----
  const fetchSelectedRoom = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/cart-details");
      const userCart = (Array.isArray(res.data) ? res.data : []).filter((item) => item.user_id === userId);
      const room = userCart.find((item) => item.room !== null)?.room;

      if (room) {
        setSelectedRoom(room);
      } else {
        toast.info("Vui lòng sang trang Dịch vụ để chọn phòng trước khi thêm món vào giỏ hàng.");
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra phòng:", error);
      toast.error(`Lỗi khi kiểm tra phòng: ${error.response?.data?.message || error.message}`);
    }
  }, [userId]);

  // ---- Mount ----
  useEffect(() => {
    fetchCategories();
    fetchSelectedRoom();
  }, [fetchCategories, fetchSelectedRoom]);

  // ---- Cleanup debounce timer ----
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  // ---- Interactions ----
  const handleCategoryClick = (id) => {
    if (id === activeCategory) return;
    setActiveCategory(id);
    if (!menusByCategory[id]) fetchMenusByCategory(id);

    setSearch("");
    setSearchResults([]);
    setSortBy("popular");
  };

  const handleAddToCart = async (menu) => {
    if (!selectedRoom) {
      const toastId = toast.warning(
          <div>
            <h6>Chưa chọn phòng!</h6>
            <p>Vui lòng chuyển sang trang Dịch vụ để chọn phòng trước khi thêm món.</p>
            <button
                className="btn btn-sm btn-brand mt-2"
                onClick={() => {
                  toast.dismiss(toastId);
                  window.location.href = "/Service";
                }}
            >
              Đi đến trang dịch vụ
            </button>
          </div>,
          { autoClose: false, closeOnClick: false, draggable: false }
      );
      return;
    }

    try {
      setAddingId(menu.id);
      const res = await axios.get("http://localhost:8000/api/cart-details");
      const userCart = (Array.isArray(res.data) ? res.data : []).filter((item) => item.user_id === userId);
      const isDuplicate = userCart.some((item) => item.menu_id === menu.id);

      if (isDuplicate) {
        toast.error(`Món "${menu.name}" đã có trong giỏ hàng.`);
        return;
      }

      const payload = {
        user_id: userId,
        room_id: selectedRoom.id,
        menus: [{ menu_id: menu.id, quantity: 1, price_per_table: menu.price }],
      };

      await axios.post("http://localhost:8000/api/cart-details", payload);

      const toastId = toast.success(
          <div>
            <h6>Đã thêm vào giỏ!</h6>
            <p>Đã thêm món “{menu.name}”.</p>
            <div className="d-flex gap-2 mt-2">
              <button
                  className="btn btn-sm btn-brand"
                  onClick={() => {
                    toast.dismiss(toastId);
                    window.location.href = "/cart-details";
                  }}
              >
                Xem giỏ hàng
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => toast.dismiss(toastId)}>
                Tiếp tục đặt
              </button>
            </div>
          </div>,
          { autoClose: 5000 }
      );
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      toast.error(error.response?.data?.message || "Thêm vào giỏ hàng thất bại.");
    } finally {
      setAddingId(null);
    }
  };

  // ---- Derived menus: search + sort ----
  const filteredMenus = useMemo(() => {
    const list = menusByCategory[activeCategory] || [];
    const q = search.trim().toLowerCase();

    let result = q ? list.filter((m) => (m?.name || "").toLowerCase().includes(q)) : [...list];

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "name_asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
        break;
      default:
        result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    return result;
  }, [menusByCategory, activeCategory, search, sortBy]);

  // ---- UI helpers ----
  const renderSkeletonCards = (count = 6) =>
      Array.from({ length: count }).map((_, i) => (
          <div key={`sk-${i}`} className="col-12 col-sm-6 col-lg-4">
            <div className="menu-card skeleton">
              <div className="menu-card__media skeleton-box" />
              <div className="menu-card__body">
                <div className="skeleton-line w-75 mb-2" />
                <div className="skeleton-line w-50 mb-3" />
                <div className="d-flex justify-content-between align-items-center">
                  <div className="skeleton-pill w-25" />
                  <div className="skeleton-btn" />
                </div>
              </div>
            </div>
          </div>
      ));

  return (
      <>
        <div id="menu-content" className="container my-4">
          {/* Header */}
          <div className="menu-hero">
            <div className="hero-badge">Thực đơn</div>
            <h1>Chọn món ngon • Trải nghiệm mượt mà</h1>
            <p className="hero-sub">Nguồn nguyên liệu tươi – giá minh bạch – đặt món trong vài giây.</p>
          </div>

          {/* Category chips */}
          <div className="category-bar">
            <div className="category-scroller" role="tablist" aria-label="Danh mục món ăn">
              {isLoadingCategories ? (
                  <>
                    <span className="chip skeleton-chip" />
                    <span className="chip skeleton-chip" />
                    <span className="chip skeleton-chip" />
                    <span className="chip skeleton-chip" />
                  </>
              ) : (
                  categories.map((cat) => (
                      <button
                          key={cat.id}
                          className={`chip ${activeCategory === cat.id ? "chip--active" : ""}`}
                          role="tab"
                          aria-selected={activeCategory === cat.id}
                          onClick={() => handleCategoryClick(cat.id)}
                          title={cat.name}
                      >
                        <i className="fa fa-folder-open me-2" aria-hidden="true" />
                        <span className="text-truncate">{cat.name}</span>
                      </button>
                  ))
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="row g-2 align-items-center mb-3">
            <div className="col-12 col-md-7">
              <div className="searchbox">
                <i className="fa fa-search searchbox__icon" aria-hidden="true" />
                <input
                    type="text"
                    className="form-control searchbox__input"
                    placeholder="Nhập tên món ăn…"
                    value={search}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearch(val);
                      if (debounceTimer) clearTimeout(debounceTimer);
                      const t = setTimeout(() => searchMenus(val), 350);
                      setDebounceTimer(t);
                    }}
                    aria-label="Tìm món"
                />
                {search && (
                    <button
                        className="btn btn-link searchbox__clear"
                        aria-label="Xoá tìm kiếm"
                        onClick={() => {
                          setSearch("");
                          setSearchResults([]);
                        }}
                    >
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                )}
              </div>
            </div>
            <div className="col-12 col-md-5">
              <div className="sortbox">
                <label htmlFor="sort" className="sortbox__label">Sắp xếp</label>
                <select
                    id="sort"
                    className="form-select sortbox__select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popular">Mới nhất/Phổ biến</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="name_asc">Tên (A → Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="row g-4">
            {search.trim().length >= 2 ? (
                isSearching ? (
                    renderSkeletonCards(6)
                ) : searchResults.length > 0 ? (
                    searchResults.map((item) => (
                        <div key={`s-${item.id}`} className="col-12 col-sm-6 col-lg-4">
                          <article className="menu-card">
                            <div className="menu-card__media">
                              <img
                                  src={item.image_url || `http://localhost:8000/storage/menus/${item.image || "default.jpg"}`}
                                  alt={item.name}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://dummyimage.com/800x450/eeeeee/bbb&text=No+Image";
                                  }}
                              />
                              <span className="menu-card__price">{VND(item.price || 0)}</span>
                            </div>
                            <div className="menu-card__body">
                              <h3 className="menu-card__title" title={item.name}>{item.name}</h3>
                              <p className="menu-card__desc" title={item.description}>
                                {item.description || "Chưa có mô tả cho món này."}
                              </p>
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="menu-card__meta text-muted">
                                  <i className="fa fa-folder-open me-1" aria-hidden="true" />
                                  <span>{item?.category?.name || "Danh mục"}</span>
                                </div>
                                <button
                                    className="btn btn-brand btn-sm"
                                    onClick={() => handleAddToCart(item)}
                                    aria-label={`Thêm ${item.name} vào giỏ`}
                                    disabled={addingId === item.id}
                                >
                                  {addingId === item.id ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                        Đang thêm…
                                      </>
                                  ) : (
                                      <>
                                        <i className="fa fa-cart-plus me-2" aria-hidden="true" />
                                        Thêm
                                      </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </article>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                      <div className="empty-state text-center">
                        <i className="fa fa-search empty-state__icon" aria-hidden="true" />
                        <h4>Không tìm thấy món phù hợp</h4>
                        <p className="text-muted">Thử từ khoá khác (tối thiểu 2 ký tự).</p>
                      </div>
                    </div>
                )
            ) : isLoadingMenus ? (
                renderSkeletonCards(6)
            ) : filteredMenus.length > 0 ? (
                filteredMenus.map((item) => (
                    <div key={item.id} className="col-12 col-sm-6 col-lg-4">
                      <article className="menu-card">
                        <div className="menu-card__media">
                          <img
                              src={`http://localhost:8000/storage/menus/${item.image || "default.jpg"}`}
                              alt={item.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "https://dummyimage.com/800x450/eeeeee/bbb&text=No+Image";
                              }}
                          />
                          <span className="menu-card__price">{VND(item.price || 0)}</span>
                        </div>
                        <div className="menu-card__body">
                          <h3 className="menu-card__title" title={item.name}>{item.name}</h3>
                          <p className="menu-card__desc" title={item.description}>
                            {item.description || "Chưa có mô tả cho món này."}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="menu-card__meta text-muted">
                              <i className="fa fa-cutlery me-1" aria-hidden="true" />
                              <span>Món chính</span>
                            </div>
                            <button
                                className="btn btn-brand btn-sm"
                                onClick={() => handleAddToCart(item)}
                                aria-label={`Thêm ${item.name} vào giỏ`}
                                disabled={addingId === item.id}
                            >
                              {addingId === item.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                    Đang thêm…
                                  </>
                              ) : (
                                  <>
                                    <i className="fa fa-cart-plus me-2" aria-hidden="true" />
                                    Thêm
                                  </>
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    </div>
                ))
            ) : (
                <div className="col-12">
                  <div className="empty-state text-center">
                    <i className="fa fa-utensils empty-state__icon" aria-hidden="true" />
                    <h4>Không có món trong danh mục</h4>
                  </div>
                </div>
            )}
          </div>
        </div>

        <ToastContainer position="bottom-right" />
      </>
  );
};

export default Menu;
