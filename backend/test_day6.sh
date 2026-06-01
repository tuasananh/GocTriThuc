#!/usr/bin/env bash
# ==============================================================================
# GocTriThuc — Day 6 Backend CLI Test Script & Manual Scenario Runner
# ==============================================================================
# Script này hướng dẫn và hỗ trợ chạy thử nghiệm thủ công các endpoint Day 6
# sử dụng curl để đối chiếu dữ liệu nghiệp vụ và các ràng buộc bảo mật.
# ==============================================================================

# Thiết lập mã màu ANSI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0;50m' # No Color
BOLD='\033[1m'

BASE_URL="http://localhost:8080"

clear
echo -e "${BLUE}${BOLD}======================================================================"
echo -e "         GOCTRITHUC — DAY 6 BACKEND MANUAL TESTING SCENARIOS          "
echo -e "======================================================================${NC}"
echo -e "Script này hỗ trợ chạy thử nghiệm thủ công các API của Day 6."
echo -e "Để gọi được các API bảo mật của Spring Security, bạn cần lấy Cookie phiên"
echo -e "làm việc từ trình duyệt sau khi đăng nhập và mã CSRF Token tương ứng."
echo ""
echo -e "Cách lấy trên trình duyệt (F12 -> Network -> chọn Request bất kỳ):"
echo -e " - ${CYAN}Cookie${NC}: Copy giá trị Header 'Cookie' (v.d. JSESSIONID=...)"
echo -e " - ${CYAN}CSRF Token${NC}: Copy giá trị Header 'X-CSRF-TOKEN' hoặc lấy từ cookie 'XSRF-TOKEN'"
echo -e "${BLUE}======================================================================${NC}"

# Tự động phát hiện và đọc thông tin từ cookies.txt nếu có
PRESET_COOKIE=""
PRESET_CSRF=""
if [ -f "cookies.txt" ]; then
  # Trích xuất JSESSIONID và XSRF-TOKEN từ Netscape Cookie file
  AUTO_JSESSION=$(grep -E 'JSESSIONID' cookies.txt | awk '{print $NF}')
  AUTO_XSRF=$(grep -E 'XSRF-TOKEN' cookies.txt | awk '{print $NF}')
  
  if [ -n "$AUTO_JSESSION" ]; then
    if [ -n "$AUTO_XSRF" ]; then
      PRESET_COOKIE="JSESSIONID=$AUTO_JSESSION; XSRF-TOKEN=$AUTO_XSRF"
    else
      PRESET_COOKIE="JSESSIONID=$AUTO_JSESSION"
    fi
  fi
  if [ -n "$AUTO_XSRF" ]; then
    PRESET_CSRF="$AUTO_XSRF"
  fi
fi

# Sẵn sàng sử dụng CSRF từ cookies.txt trực tiếp

# Nhập thông tin xác thực
if [ -n "$PRESET_COOKIE" ] || [ -n "$PRESET_CSRF" ]; then
  echo -e "${GREEN}${BOLD}✔ Đã tự động phát hiện file 'cookies.txt'!${NC}"
  read -p "1. Nhập Cookie xác thực (Mặc định: $PRESET_COOKIE): " USER_COOKIE
  USER_COOKIE="${USER_COOKIE:-$PRESET_COOKIE}"
  
  read -p "2. Nhập mã CSRF Token (Mặc định: $PRESET_CSRF): " CSRF_TOKEN
  CSRF_TOKEN="${CSRF_TOKEN:-$PRESET_CSRF}"
else
  read -p "1. Nhập Cookie xác thực (nhấn Enter để bỏ qua nếu chạy công khai): " USER_COOKIE
  read -p "2. Nhập mã CSRF Token (nhấn Enter để bỏ qua): " CSRF_TOKEN
fi
echo ""

# Helper to execute curl
execute_curl() {
  local method="$1"
  local path="$2"
  local data="$3"
  
  echo -e "${YELLOW}Executing: ${BOLD}${method} ${BASE_URL}${path}${NC}"
  if [ -n "$data" ]; then
    echo -e "${YELLOW}Payload: ${CYAN}${data}${NC}"
  fi
  echo -e "${BLUE}----------------------------------------------------------------------${NC}"

  local curl_opts=("-X" "$method" "-i")
  
  # Add Cookie if provided
  if [ -n "$USER_COOKIE" ]; then
    curl_opts+=("-H" "Cookie: $USER_COOKIE")
  fi

  # Add CSRF headers if provided (send both X-CSRF-TOKEN and X-XSRF-TOKEN for SPA/MVC compatibility)
  if [ -n "$CSRF_TOKEN" ]; then
    curl_opts+=("-H" "X-CSRF-TOKEN: $CSRF_TOKEN" "-H" "X-XSRF-TOKEN: $CSRF_TOKEN")
  fi

  # Add JSON headers
  if [ -n "$data" ]; then
    curl_opts+=("-H" "Content-Type: application/json" "-d" "$data")
  fi

  # Run curl and display
  curl "${curl_opts[@]}" "${BASE_URL}${path}"
  echo ""
  echo -e "${BLUE}----------------------------------------------------------------------${NC}"
}

show_menu() {
  echo -e "${BOLD}--- MENU KIỂM THỬ ENDPOINT DAY 6 ---${NC}"
  echo -e " ${GREEN}1.${NC} Tạo Module mới (${BOLD}POST /api/courses/{courseId}/modules${NC})"
  echo -e " ${GREEN}2.${NC} Sửa tiêu đề Module (${BOLD}PUT /api/modules/{id}${NC})"
  echo -e " ${GREEN}3.${NC} Xóa Module và bài giảng cascade (${BOLD}DELETE /api/modules/{id}${NC})"
  echo -e " ${GREEN}4.${NC} Hoán đổi vị trí Module (${BOLD}PATCH /api/modules/{id}/order${NC})"
  echo -e " ${GREEN}5.${NC} Tạo bài giảng mới (${BOLD}POST /api/modules/{moduleId}/lessons${NC})"
  echo -e " ${GREEN}6.${NC} Lấy chi tiết bài giảng (${BOLD}GET /api/lessons/{id}${NC})"
  echo -e " ${GREEN}7.${NC} Sửa tiêu đề bài giảng (${BOLD}PUT /api/lessons/{id}${NC})"
  echo -e " ${GREEN}8.${NC} Xóa bài giảng (${BOLD}DELETE /api/lessons/{id}${NC})"
  echo -e " ${GREEN}9.${NC} Hoán đổi vị trí bài giảng (${BOLD}PATCH /api/lessons/{id}/order${NC})"
  echo -e " ${GREEN}10.${NC} Cập nhật link Video (${BOLD}PUT /api/lessons/{id}/video${NC})"
  echo -e " ${GREEN}11.${NC} Cập nhật nội dung HTML Blog (Jsoup) (${BOLD}PUT /api/lessons/{id}/blog${NC})"
  echo -e " ${GREEN}12.${NC} Cập nhật bài thi (${BOLD}PUT /api/lessons/{id}/test${NC})"
  echo -e " ${RED}0.${NC} Thoát chương trình"
  echo ""
  read -p "Vui lòng chọn chức năng (0-12): " CHOICE
}

while true; do
  show_menu
  case $CHOICE in
    1)
      read -p "Nhập ID Khóa học (Course ID): " COURSE_ID
      read -p "Nhập tiêu đề Module: " MOD_TITLE
      payload="{\"title\":\"$MOD_TITLE\"}"
      execute_curl "POST" "/api/courses/${COURSE_ID}/modules" "$payload"
      ;;
    2)
      read -p "Nhập ID Module cần sửa: " MOD_ID
      read -p "Nhập tiêu đề Module mới: " MOD_TITLE
      payload="{\"title\":\"$MOD_TITLE\"}"
      execute_curl "PUT" "/api/modules/${MOD_ID}" "$payload"
      ;;
    3)
      read -p "Nhập ID Module cần xóa: " MOD_ID
      execute_curl "DELETE" "/api/modules/${MOD_ID}" ""
      ;;
    4)
      read -p "Nhập ID Module cần dịch chuyển: " MOD_ID
      read -p "Nhập hướng dịch chuyển (up/down): " DIR
      payload="{\"direction\":\"$DIR\"}"
      execute_curl "PATCH" "/api/modules/${MOD_ID}/order" "$payload"
      ;;
    5)
      read -p "Nhập ID Module chứa bài giảng: " MOD_ID
      read -p "Nhập tiêu đề bài giảng: " LESS_TITLE
      read -p "Nhập loại bài giảng (video/blog/test): " LESS_TYPE
      payload="{\"title\":\"$LESS_TITLE\",\"lessonType\":\"$LESS_TYPE\"}"
      execute_curl "POST" "/api/modules/${MOD_ID}/lessons" "$payload"
      ;;
    6)
      read -p "Nhập ID bài giảng cần xem: " LESS_ID
      execute_curl "GET" "/api/lessons/${LESS_ID}" ""
      ;;
    7)
      read -p "Nhập ID bài giảng cần sửa tiêu đề: " LESS_ID
      read -p "Nhập tiêu đề mới: " LESS_TITLE
      payload="{\"title\":\"$LESS_TITLE\"}"
      execute_curl "PUT" "/api/lessons/${LESS_ID}" "$payload"
      ;;
    8)
      read -p "Nhập ID bài giảng cần xóa: " LESS_ID
      execute_curl "DELETE" "/api/lessons/${LESS_ID}" ""
      ;;
    9)
      read -p "Nhập ID bài giảng cần dịch chuyển: " LESS_ID
      read -p "Nhập hướng dịch chuyển (up/down): " DIR
      payload="{\"direction\":\"$DIR\"}"
      execute_curl "PATCH" "/api/lessons/${LESS_ID}/order" "$payload"
      ;;
    10)
      read -p "Nhập ID bài giảng Video: " LESS_ID
      read -p "Nhập nhà cung cấp (youtube/vimeo): " PROV
      read -p "Nhập link video URL: " PROV_VAL
      payload="{\"provider\":\"$PROV\",\"providerValue\":\"$PROV_VAL\"}"
      execute_curl "PUT" "/api/lessons/${LESS_ID}/video" "$payload"
      ;;
    11)
      read -p "Nhập ID bài giảng Blog: " LESS_ID
      echo -e "${YELLOW}Gợi ý: Thử nhập thẻ script độc hại <script>alert('xss')</script> để xem Jsoup lọc bảo mật.${NC}"
      read -p "Nhập chuỗi nội dung HTML: " HTML_VAL
      payload="{\"content\":\"$HTML_VAL\"}"
      execute_curl "PUT" "/api/lessons/${LESS_ID}/blog" "$payload"
      ;;
    12)
      read -p "Nhập ID bài giảng Test: " LESS_ID
      read -p "Nhập đề bài thi (statement): " STATEMENT
      read -p "Nhập giới hạn thời gian thi (giây): " TIME_LIM
      payload="{\"statement\":\"$STATEMENT\",\"timeLimit\":$TIME_LIM,\"settings\":{}}"
      execute_curl "PUT" "/api/lessons/${LESS_ID}/test" "$payload"
      ;;
    0)
      echo -e "${GREEN}Cảm ơn bạn đã sử dụng chương trình kiểm thử! Tạm biệt!${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}Lựa chọn không hợp lệ, vui lòng chọn lại!${NC}"
      echo ""
      ;;
  esac
done
