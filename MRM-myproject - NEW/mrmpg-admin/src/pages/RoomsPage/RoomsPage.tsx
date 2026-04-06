import React, { useState, useEffect, useCallback } from "react";
import layouts from "@/components/layouts";
import ui from "@/components/ui";
import type { types } from "@/types";
import type {
  CardItem,
  RoomData,
  RoomsApiResponse,
  RoomsFilterResponse,
  RoomsStatsResponse,
} from "@/types/apiResponseTypes";
import "./RoomsPage.scss";
import { useNotification } from "@/hooks/useNotification";
import { ApiClient, AuthManager } from "@/utils";
import { useNavigate } from "react-router-dom";

interface UnifiedFilterValues {
  search: string;
  pgId: string;
  occupancyStatus: string;
  month: string;
  year: string;
  roomId: string;
}

interface EBChargeData {
  id: string;
  roomId: string;
  roomNo: string;
  pgId: string;
  amount: number;
  month: number;
  year: number;
  billDate: string;
  unitsUsed: number;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  pgName: string;
  pgLocation: string;
  adminName: string;
  adminEmail: string;
  [key: string]: unknown; // Index signature for TableData compatibility
}

const RoomPage = (): React.ReactElement => {
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [pgDetails, setPgDetails] = useState<{
    id: string;
    name: string;
    type: string;
    location: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);
  const [sortState, setSortState] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });
  const [filters, setFilters] = useState<UnifiedFilterValues>({
    search: "",
    pgId: "",
    occupancyStatus: "",
    month: "",
    year: "",
    roomId: "",
  });

  const [filterItems, setFilterItems] = useState<types["FilterItemProps"][]>(
    []
  );

  // Room statistics
  const [roomStats, setRoomStats] = useState<CardItem[]>([
    { icon: "clock" },
    { icon: "clock" },
    { icon: "clock" },
    { icon: "clock" },
  ]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEBModalOpen, setIsEBModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<"rooms" | "eb-charges">("rooms");

  // EB Charges data
  const [ebChargesData, setEbChargesData] = useState<EBChargeData[]>([]);
  const [ebChargesLoading, setEbChargesLoading] = useState(false);

  //Loading states
  const [filterLoading, setFilterLoading] = useState(false);
  const [roomStatsLoading, setRoomStatsLoading] = useState(false);
  const [roomDataLoading, setRoomDataLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const notification = useNotification();
  const navigate = useNavigate();

  // fetch rooms data
  const fetchRoomsData = useCallback(
    async (
      page: number,
      filterParams: UnifiedFilterValues,
      sortKey: string | null = null,
      sortDirection: "asc" | "desc" = "asc"
    ) => {
      setRoomDataLoading(true);
      try {
        // Build query parameters
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          ...(filterParams.search && { search: filterParams.search }),
          ...(filterParams.occupancyStatus && {
            occupancyStatus: filterParams.occupancyStatus,
          }),
          ...(sortKey && { sortBy: sortKey }),
          ...(sortKey && { sortOrder: sortDirection }),
        });

        const apiResponse = (await ApiClient.get(
          `/rooms/${filterParams.pgId}?${queryParams.toString()}`
        )) as RoomsApiResponse;

        if (apiResponse.success && apiResponse.data) {
          setRoomsData(apiResponse.data.rooms || []);
          setPgDetails(apiResponse.data.pgDetails || null);
          setCurrentPage(apiResponse.data.pagination?.page || 1);
          setTotalPages(apiResponse.data.pagination?.totalPages || 1);
          setTotalRooms(apiResponse.data.pagination?.total || 0);
        } else {
          notification.showError(
            apiResponse.error || "Failed to fetch rooms data",
            apiResponse.message,
            5000
          );
          setRoomsData([]);
        }
      } catch (err) {
        notification.showError(
          "Failed to fetch rooms data",
          err instanceof Error
            ? err.message
            : "Check your internet connection and try again.",
          5000
        );
        setRoomsData([]);
      } finally {
        setRoomDataLoading(false);
      }
    },
    [notification]
  );

  //fetch filters
  const fetchFilters = useCallback(async () => {
    setFilterLoading(true);
    try {
      const apiResponse = (await ApiClient.get(
        "/filters/rooms"
      )) as RoomsFilterResponse;
      if (apiResponse.success && apiResponse.data) {
        setFilterItems(apiResponse.data.filters);
      } else {
        notification.showError(
          apiResponse.error || "Failed to fetch filters",
          apiResponse.message,
          5000
        );
      }
    } catch (err) {
      notification.showError(
        "Failed to fetch filters",
        err instanceof Error
          ? err.message
          : "Check your internet connection and try again.",
        5000
      );
    } finally {
      setFilterLoading(false);
    }
  }, [notification]);

  // Fetch rooms for a given PG to populate the roomId filter (same logic as EBModal)
  const fetchRoomsForFilter = useCallback(
    async (pgId: string) => {
      if (!pgId) return;
      setFilterLoading(true);
      try {
        const response = (await ApiClient.get(
          `/filters/pg/rooms?pgId=${pgId}`
        )) as {
          success: boolean;
          data?: {
            options: Array<{ value: string; label: string }>; // room options
            pgInfo?: unknown;
          };
          message?: string;
          error?: string;
        };

        if (response.success && response.data) {
          const roomOptions = response.data.options || [];

          // Update the current filterItems: set options for the roomId filter if present
          setFilterItems((prev) => {
            // create a shallow copy and modify 'roomId' filter options
            const next = prev.map((item) => {
              if (item.id === "roomId") {
                return {
                  ...item,
                  options: roomOptions,
                };
              }
              return item;
            });

            // If roomId filter was not present, append it
            const hasRoomId = next.some((it) => it.id === "roomId");
            if (!hasRoomId) {
              next.push({
                id: "roomId",
                label: "Room",
                type: "select",
                options: roomOptions,
              } as unknown as types["FilterItemProps"]);
            }

            return next;
          });
        } else {
          notification.showError(
            response.error || "Failed to fetch rooms for PG",
            response.message,
            5000
          );
        }
      } catch (err) {
        notification.showError(
          "Failed to fetch rooms for PG",
          err instanceof Error
            ? err.message
            : "Check your internet connection and try again.",
          5000
        );
      } finally {
        setFilterLoading(false);
      }
    },
    [notification]
  );

  //fetch EB filters
  const fetchEBFilters = useCallback(async () => {
    setFilterLoading(true);
    try {
      const apiResponse = (await ApiClient.get(
        "/filters/eb-charges"
      )) as RoomsFilterResponse;
      if (apiResponse.success && apiResponse.data) {
        setFilterItems(apiResponse.data.filters);

        // Check if pgLocation filter has a defaultValue
        const pgLocationFilter = apiResponse.data.filters.find(
          (filter) => filter.id === "pgLocation"
        );
        if (pgLocationFilter && pgLocationFilter.defaultValue) {
          const defaultPgId = pgLocationFilter.defaultValue as string;
          // Update filters with the default PG ID
          setFilters((prev) => ({
            ...prev,
            pgId: defaultPgId,
          }));
        }
      } else {
        notification.showError(
          apiResponse.error || "Failed to fetch EB filters",
          apiResponse.message,
          5000
        );
      }
    } catch (err) {
      notification.showError(
        "Failed to fetch EB filters",
        err instanceof Error
          ? err.message
          : "Check your internet connection and try again.",
        5000
      );
    } finally {
      setFilterLoading(false);
    }
  }, [notification]);

  const fetchRoomStats = useCallback(
    async (filters: UnifiedFilterValues) => {
      setRoomStatsLoading(true);
      try {
        let endPoint;
        if (filters.pgId) {
          endPoint = `/stats/rooms/${filters.pgId}`;
        } else {
          endPoint = "/stats/rooms";
        }

        const apiResponse = (await ApiClient.get(
          endPoint
        )) as RoomsStatsResponse;

        if (apiResponse.success && apiResponse.data) {
          setRoomStats(apiResponse.data.cards || []);
        } else {
          notification.showError(
            apiResponse.error || "Failed to fetch room stats",
            apiResponse.message,
            5000
          );
        }
      } catch (err) {
        notification.showError(
          "Failed to fetch room stats",
          err instanceof Error
            ? err.message
            : "Check your internet connection and try again.",
          5000
        );
      } finally {
        setRoomStatsLoading(false);
      }
    },
    [notification]
  );

  // Fetch EB charges based on selected room
  const fetchEBCharges = useCallback(
    async (filterParams: UnifiedFilterValues, page: number = 1) => {
      if (!filterParams.roomId) {
        setEbChargesData([]);
        return;
      }

      setEbChargesLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          ...(filterParams.search && { search: filterParams.search }),
          ...(filterParams.month && { month: filterParams.month }),
          ...(filterParams.year && { year: filterParams.year }),
        });

        const apiResponse = (await ApiClient.get(
          `/rooms/${filterParams.roomId}/eb-charges?${queryParams.toString()}`
        )) as {
          success: boolean;
          data?: {
            electricityCharges: EBChargeData[];
            pagination: {
              page: number;
              totalPages: number;
              total: number;
            };
          };
          error?: string;
          message?: string;
        };

        if (apiResponse.success && apiResponse.data) {
          setEbChargesData(apiResponse.data.electricityCharges || []);
          setCurrentPage(apiResponse.data.pagination?.page || 1);
          setTotalPages(apiResponse.data.pagination?.totalPages || 1);
        } else {
          notification.showError(
            apiResponse.error || "Failed to fetch EB charges",
            apiResponse.message,
            5000
          );
          setEbChargesData([]);
        }
      } catch (err) {
        notification.showError(
          "Failed to fetch EB charges",
          err instanceof Error
            ? err.message
            : "Check your internet connection and try again.",
          5000
        );
        setEbChargesData([]);
      } finally {
        setEbChargesLoading(false);
      }
    },
    [notification]
  );

  const handleFilterReset = () => {
    const resetFilters: UnifiedFilterValues = {
      search: "",
      pgId: "",
      occupancyStatus: "",
      month: "",
      year: "",
      roomId: "",
    };
    setFilters(resetFilters);
    setCurrentPage(1);

    if (activeTab === "rooms") {
      fetchRoomsData(1, resetFilters, sortState.key, sortState.direction);
      fetchRoomStats(resetFilters);
    } else {
      fetchEBCharges(resetFilters, 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchRoomsData(page, filters, sortState.key, sortState.direction);
  };

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortState({ key, direction });
    fetchRoomsData(currentPage, filters, key, direction);
  };

  // Room action handlers
  const handleAddRoom = () => {
    setIsAddModalOpen(true);
  };

  const handleAddEBBill = () => {
    setIsEBModalOpen(true);
  };

  const handleEditRoom = (room: RoomData) => {
    setSelectedRoom(room);
    setIsEditModalOpen(true);
  };

  const handleRowClick = (room: RoomData) => {
    console.log("Room details:", room);
    // You can implement a detailed view modal here
  };

  const confirmDeleteRoom = async (roomId: string) => {
    setSaveLoading(true);
    try {
      const apiResponse = (await ApiClient.delete(`/rooms/${roomId}`)) as {
        success: boolean;
        message?: string;
        error?: string;
      };

      if (apiResponse.success) {
        const roomToDelete = selectedRoom;
        notification.showSuccess(
          "Room deleted successfully",
          `Room ${roomToDelete?.roomNo} has been deleted.`,
          5000
        );
        setIsEditModalOpen(false);
        setSelectedRoom(null);
        // Refresh data
        fetchRoomsData(
          currentPage,
          filters,
          sortState.key,
          sortState.direction
        );
        fetchRoomStats(filters);
      } else {
        notification.showError(
          apiResponse.error || "Failed to delete room",
          apiResponse.message,
          5000
        );
      }
    } catch (err) {
      notification.showError(
        "Failed to delete room",
        err instanceof Error
          ? err.message
          : "An error occurred while deleting the room.",
        5000
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveEBBill = async (ebData: {
    roomId: string;
    amount: number;
    month: number;
    year: number;
    billDate: string;
    unitsUsed: number;
    description: string;
  }) => {
    setSaveLoading(true);
    try {
      const apiResponse = (await ApiClient.post(
        `/rooms/${ebData.roomId}/eb-charge`,
        ebData
      )) as {
        success: boolean;
        message?: string;
        error?: string;
        data?: unknown;
      };

      if (apiResponse.success) {
        notification.showSuccess(
          "EB Bill added successfully",
          "Electricity bill has been added successfully.",
          5000
        );
        setIsEBModalOpen(false);
        // Optionally refresh room data if needed
        fetchRoomsData(
          currentPage,
          filters,
          sortState.key,
          sortState.direction
        );
      } else {
        notification.showError(
          apiResponse.error || "Failed to add EB bill",
          apiResponse.message,
          5000
        );
      }
    } catch (err) {
      notification.showError(
        "Failed to add EB bill",
        err instanceof Error
          ? err.message
          : "An error occurred while adding the EB bill.",
        5000
      );
    } finally {
      setSaveLoading(false);
    }
  };

  // Initial load effect - only runs when tab changes or page loads
  useEffect(() => {
    if (AuthManager.isAuthenticated()) {
      if (activeTab === "rooms") {
        fetchFilters();
        const initialFilters = {
          search: "",
          pgId: "",
          occupancyStatus: "",
          month: "",
          year: "",
          roomId: "",
        };
        fetchRoomStats(initialFilters);
        fetchRoomsData(1, initialFilters, null, "asc");
      } else {
        fetchEBFilters();
      }
    } else {
      navigate("/login");
    }
  }, [
    activeTab,
    fetchFilters,
    fetchEBFilters,
    fetchRoomStats,
    fetchRoomsData,
    navigate,
  ]);

  // Effect for room data changes in rooms tab
  useEffect(() => {
    if (AuthManager.isAuthenticated() && activeTab === "rooms") {
      fetchRoomsData(currentPage, filters, sortState.key, sortState.direction);
      if (filters.pgId !== "") {
        fetchRoomStats(filters);
      }
    }
  }, [
    filters,
    activeTab,
    currentPage,
    sortState,
    fetchRoomsData,
    fetchRoomStats,
  ]);

  // Effect for EB charges data changes
  useEffect(() => {
    if (
      AuthManager.isAuthenticated() &&
      activeTab === "eb-charges" &&
      filters.roomId
    ) {
      fetchEBCharges(filters, currentPage);
    }
  }, [filters, activeTab, currentPage, fetchEBCharges]);

  // Separate effect to handle room fetching when pgId changes in EB charges tab
  useEffect(() => {
    if (activeTab === "eb-charges" && filters.pgId && !filters.roomId) {
      fetchRoomsForFilter(filters.pgId);
    }
  }, [activeTab, filters.pgId, filters.roomId, fetchRoomsForFilter]);

  const tableColumns: types["TableColumn"][] = [
    {
      key: "roomNo",
      label: "Room No",
      width: "15%",
      align: "center" as const,
      render: (value: unknown) => (
        <span className="room-number">{value as string}</span>
      ),
    },
    {
      key: "occupied",
      label: "Occupied",
      width: "15%",
      align: "center" as const,
      render: (_value: unknown, row: unknown) => {
        const roomData = row as RoomData;
        return (
          <span
            className={`occupancy occupancy--${roomData.status.replace(
              "_",
              "-"
            )}`}
          >
            {roomData.currentOccupancy}/{roomData.capacity}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      width: "20%",
      align: "center" as const,
      render: (_value: unknown, row: unknown) => {
        const roomData = row as RoomData;
        return (
          <span
            className={`status-badge status-badge--${roomData.statusValue.replace(
              "_",
              "-"
            )}`}
          >
            {roomData.statusValue
              .replace("_", " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      width: "30%",
      align: "center" as const,
      render: (_value: unknown, row: unknown) => {
        const roomData = row as RoomData;
        return (
          <div className="room-actions">
            <ui.Button
              variant="transparent"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditRoom(roomData);
              }}
              className="action-btn edit-btn"
            >
              <ui.Icons name="edit" size={14} />
            </ui.Button>
          </div>
        );
      },
    },
  ];

  // EB Charges table columns
  const ebChargesTableColumns: types["TableColumn"][] = [
    {
      key: "pgName",
      label: "PG Name",
      width: "12%",
      align: "left" as const,
      render: (value: unknown) => (
        <span className="pg-name">{value as string}</span>
      ),
    },
    {
      key: "roomNo",
      label: "Room No",
      width: "12%",
      align: "center" as const,
      render: (value: unknown) => (
        <span className="room-number">{value as string}</span>
      ),
    },
    {
      key: "pgLocation",
      label: "Location",
      width: "12%",
      align: "center" as const,
      render: (value: unknown) => (
        <span className="pg-location">{value as string}</span>
      ),
    },
    {
      key: "month",
      label: "Month/Year",
      width: "12%",
      align: "center" as const,
      render: (_value: unknown, row: unknown) => {
        const ebData = row as EBChargeData;
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return (
          <span>
            {monthNames[ebData.month - 1]} {ebData.year}
          </span>
        );
      },
    },
    {
      key: "unitsUsed",
      label: "Units Used",
      width: "10%",
      align: "center" as const,
      render: (value: unknown) => <span>{value as number} units</span>,
    },
    {
      key: "amount",
      label: "Amount",
      width: "10%",
      align: "center" as const,
      render: (value: unknown) => (
        <div className="currency-value">
          <span className="currency-symbol">
            <ui.Icons name="indianRupee" size={14} />
          </span>
          <span className="currency-amount">
            {(value as number).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: "billDate",
      label: "Bill Date",
      width: "12%",
      align: "center" as const,
      render: (value: unknown) => (
        <span>{new Date(value as string).toLocaleDateString()}</span>
      ),
    },
    {
      key: "adminName",
      label: "Added By",
      width: "12%",
      align: "center" as const,
      render: (value: unknown) => (
        <span className="admin-name">{value as string}</span>
      ),
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      width: "15%",
      align: "left" as const,
      render: (value: unknown) => {
        const description = value as string | null;
        return (
          <span className="description" title={description || ""}>
            {description && description.length > 30
              ? `${description.substring(0, 30)}...`
              : description || "-"}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <div className="room-page">
        <div className="room-page__header">
          <layouts.HeaderLayout
            title="Room Management"
            subText="Manage and view detailed information of all PG rooms and their occupancy status"
          />
        </div>

        <div className="room-page__content">
          {/* Tab Navigation */}
          <div className="room-page__tabs">
            <ui.Tabs
              tabs={[
                {
                  id: "rooms",
                  label: "Rooms",
                },
                {
                  id: "eb-charges",
                  label: "EB Charges",
                },
              ]}
              activeTab={activeTab}
              onTabChange={(tabId) => {
                setActiveTab(tabId as "rooms" | "eb-charges");
                // Reset filters and fetch appropriate filters for the new tab
                const resetFilters: UnifiedFilterValues = {
                  search: "",
                  pgId: "",
                  occupancyStatus: "",
                  month: "",
                  year: "",
                  roomId: "",
                };
                setFilters(resetFilters);
                setCurrentPage(1);

                if (tabId === "rooms") {
                  fetchFilters();
                  fetchRoomsData(
                    1,
                    resetFilters,
                    sortState.key,
                    sortState.direction
                  );
                  fetchRoomStats(resetFilters);
                } else {
                  fetchEBFilters();
                  // Don't fetch EB charges until a PG is selected
                }
              }}
              showCounts={true}
              className="room-tabs"
            />
          </div>

          {/* Filters - Single unified filter */}
          <div className="room-page__filters">
            <layouts.FilterLayout
              filters={filterItems}
              loading={filterLoading}
              className={activeTab === "rooms" ? "room-filters" : "eb-filters"}
              columns={3}
              showResetButton
              onReset={handleFilterReset}
              onChange={(
                id: string,
                value:
                  | string
                  | string[]
                  | number
                  | boolean
                  | Date
                  | { start: string; end: string }
                  | null
              ) => {
                const newFilters: UnifiedFilterValues = {
                  search:
                    id === "search" ? (value as string) || "" : filters.search,
                  pgId:
                    id === "pgLocation"
                      ? (value as string) || ""
                      : filters.pgId,
                  occupancyStatus:
                    id === "occupancyStatus"
                      ? (value as string) || ""
                      : filters.occupancyStatus,
                  month:
                    id === "month" ? (value as string) || "" : filters.month,
                  year: id === "year" ? (value as string) || "" : filters.year,
                  roomId:
                    id === "roomId" ? (value as string) || "" : filters.roomId,
                };
                setFilters(newFilters);
                setCurrentPage(1);

                // If PG location changed while on EB Charges tab, fetch rooms for that PG to populate room filter
                if (id === "pgLocation" && activeTab === "eb-charges") {
                  const pgId = (value as string) || "";
                  if (pgId) {
                    fetchRoomsForFilter(pgId);
                  } else {
                    // If PG was cleared, remove room options from filterItems and clear EB data
                    setFilterItems((prev) =>
                      prev.map((item) =>
                        item.id === "roomId" ? { ...item, options: [] } : item
                      )
                    );
                    setEbChargesData([]);
                  }
                }

                if (activeTab === "rooms") {
                  // Always fetch room data
                  fetchRoomsData(
                    1,
                    newFilters,
                    sortState.key,
                    sortState.direction
                  );

                  // Only refresh stats when PG selection changes
                  if (id === "pgLocation") {
                    fetchRoomStats(newFilters);
                  }
                } else {
                  // Fetch EB charges data only if a room is selected
                  if (newFilters.roomId) {
                    fetchEBCharges(newFilters, 1);
                  } else if (id === "roomId") {
                    // If room was deselected, clear EB charges data
                    setEbChargesData([]);
                  }
                }
              }}
            />
          </div>

          {/* Conditional Content based on active tab */}
          {activeTab === "rooms" ? (
            <>
              {/* Rooms Content */}
              <div className="room-page__cards">
                <layouts.CardGrid
                  cards={roomStats}
                  loading={roomStatsLoading}
                  columns={4}
                  gap="md"
                  className="room-cards"
                />
              </div>

              <div className="room-page__actions">
                <ui.Button
                  variant="primary"
                  size="medium"
                  onClick={handleAddRoom}
                  className="add-room-btn"
                  leftIcon={<ui.Icons name="plus" size={16} />}
                >
                  Add New Room
                </ui.Button>
                <ui.Button
                  variant="secondary"
                  size="medium"
                  onClick={handleAddEBBill}
                  className="add-eb-bill-btn"
                  leftIcon={<ui.Icons name="plus" size={16} />}
                >
                  Add EB
                </ui.Button>
              </div>

              <div className="room-page__table">
                <layouts.TableLayout
                  columns={tableColumns}
                  data={roomsData}
                  loading={roomDataLoading}
                  pagination={{
                    currentPage: currentPage,
                    totalPages: totalPages,
                    totalItems: totalRooms,
                    onPageChange: handlePageChange,
                  }}
                  pageSize={10}
                  currentSort={sortState}
                  onSort={handleSort}
                  onRowClick={(row) => handleRowClick(row as RoomData)}
                  emptyMessage="No rooms found"
                  className="rooms-table"
                />
              </div>
            </>
          ) : (
            <>
              {/* EB Charges Content */}
              <div className="room-page__actions">
                <ui.Button
                  variant="primary"
                  size="medium"
                  onClick={handleAddEBBill}
                  className="add-eb-bill-btn"
                  leftIcon={<ui.Icons name="plus" size={16} />}
                >
                  Add EB Bill
                </ui.Button>
              </div>

              <div className="room-page__table">
                <layouts.TableLayout
                  columns={ebChargesTableColumns}
                  data={ebChargesData}
                  loading={ebChargesLoading}
                  pagination={{
                    currentPage: currentPage,
                    totalPages: totalPages,
                    totalItems: ebChargesData.length,
                    onPageChange: (page) => {
                      setCurrentPage(page);
                      if (filters.roomId) {
                        fetchEBCharges(filters, page);
                      }
                    },
                  }}
                  pageSize={10}
                  emptyMessage={
                    filters.roomId
                      ? "No EB charges found for this room"
                      : filters.pgId
                      ? "Please select a room to view EB charges"
                      : "Please select a PG location and room to view EB charges"
                  }
                  className="eb-charges-table"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Room Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <layouts.RoomModal
          isOpen={isAddModalOpen || isEditModalOpen}
          isEdit={isEditModalOpen}
          roomData={isEditModalOpen ? selectedRoom : null}
          pgDetails={pgDetails}
          filterItems={filterItems}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedRoom(null);
          }}
          onSave={async (roomData) => {
            setSaveLoading(true);
            try {
              let apiResponse;
              if (isEditModalOpen && selectedRoom) {
                // Update existing room - only send roomNo and capacity
                const updateData = {
                  roomNo: roomData.roomNo,
                  capacity: roomData.capacity
                };
                apiResponse = (await ApiClient.put(
                  `/rooms/${selectedRoom.id}`,
                  updateData
                )) as { success: boolean; message?: string; error?: string };
                if (apiResponse.success) {
                  notification.showSuccess(
                    "Room updated successfully",
                    `Room ${roomData.roomNo} has been updated successfully.`,
                    5000
                  );
                } else {
                  notification.showError(
                    apiResponse.error || "Failed to update room",
                    apiResponse.message,
                    5000
                  );
                  return;
                }
              } else {
                // Create new room - send all fields
                apiResponse = (await ApiClient.post(
                  `/rooms/${roomData.pgLocation}`,
                  roomData
                )) as { success: boolean; message?: string; error?: string };
                if (apiResponse.success) {
                  notification.showSuccess(
                    "Room created successfully",
                    `Room ${roomData.roomNo} has been created successfully.`,
                    5000
                  );
                } else {
                  notification.showError(
                    apiResponse.error || "Failed to create room",
                    apiResponse.message,
                    5000
                  );
                  return;
                }
              }

              // Close modal and refresh data
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedRoom(null);

              // Refresh all data
              await Promise.all([
                fetchRoomsData(
                  currentPage,
                  filters,
                  sortState.key,
                  sortState.direction
                ),
                fetchRoomStats(filters),
              ]);
            } catch (err) {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : "An unexpected error occurred.";
              notification.showError(
                isEditModalOpen
                  ? "Failed to update room"
                  : "Failed to create room",
                errorMessage,
                5000
              );
            } finally {
              setSaveLoading(false);
            }
          }}
          onDelete={confirmDeleteRoom}
          loading={saveLoading}
        />
      )}

      {/* EB Modal */}
      {isEBModalOpen && (
        <layouts.EBModal
          isOpen={isEBModalOpen}
          onClose={() => setIsEBModalOpen(false)}
          onSave={handleSaveEBBill}
          loading={saveLoading}
        />
      )}
    </>
  );
};

export default RoomPage;
