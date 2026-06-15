import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';

export function AboutPage() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto space-y-12 mt-8 mb-16">
        <SectionHeader
          title="Giới thiệu về Góc Tri Thức"
          description="Nền tảng học tập trực tuyến chất lượng cao, nơi khơi nguồn đam mê và chia sẻ tri thức cho mọi người."
        />
        
        <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
          
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-foreground mb-4">Câu chuyện của chúng tôi</h3>
            <p className="text-lg leading-relaxed mb-4">
              Dự án <strong>Góc Tri Thức (GocTriThuc)</strong> ra đời từ niềm đam mê công nghệ và khát vọng xây dựng một môi trường học tập thực sự hiệu quả, bình đẳng cho sinh viên Việt Nam. Xuất phát điểm là một dự án phát triển bởi nhóm sinh viên đam mê kỹ thuật phần mềm đến từ Đại học Bách Khoa Hà Nội (HUST), chúng tôi thấu hiểu những khó khăn trong việc tìm kiếm nguồn tài liệu học tập chất lượng, có tính tương tác cao và được thiết kế chuẩn mực.
            </p>
            <p className="text-lg leading-relaxed">
              Từ những dòng code đầu tiên, chúng tôi đã đặt mục tiêu tạo ra một hệ thống không chỉ là nơi lưu trữ các video hay tài liệu khô khan, mà phải là một không gian học tập sống động. Nơi người học có thể tương tác trực tiếp với các bài kiểm tra, thảo luận cùng bạn bè, và được hỗ trợ bởi các công cụ học tập thông minh.
            </p>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-foreground mb-4">Tầm nhìn & Sứ mệnh</h3>
            <p className="text-lg leading-relaxed mb-4">
              <strong className="text-foreground">Tầm nhìn:</strong> Trở thành nền tảng giáo dục công nghệ trực tuyến hàng đầu, nơi bất kỳ ai - từ những người mới bắt đầu cho đến những chuyên gia - đều có thể tìm thấy không gian để nâng cao kỹ năng và phát triển sự nghiệp.
            </p>
            <p className="text-lg leading-relaxed">
              <strong className="text-foreground">Sứ mệnh:</strong> Số hóa trải nghiệm học tập truyền thống thông qua việc áp dụng các công nghệ Web hiện đại, mang đến trải nghiệm học tập mượt mà, trực quan và cá nhân hóa. Chúng tôi cam kết tạo ra giá trị bền vững cho cộng đồng học thuật.
            </p>
          </div>

          <div className="mb-12 bg-muted/20 p-8 rounded-2xl border">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Đặc điểm nổi bật</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Trải nghiệm hiện đại</h4>
                <p className="text-base leading-relaxed">Giao diện (UI/UX) được thiết kế tinh tế, loại bỏ những yếu tố gây xao nhãng để bạn hoàn toàn tập trung vào kiến thức.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Tương tác thời gian thực</h4>
                <p className="text-base leading-relaxed">Hệ thống bài kiểm tra (Quiz) và thảo luận (Comments) được tối ưu hóa, giúp việc trao đổi kiến thức diễn ra liên tục.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Nội dung phong phú</h4>
                <p className="text-base leading-relaxed">Hỗ trợ các công cụ soạn thảo mạnh mẽ, bao gồm khả năng viết công thức toán học (MathLive) và code snippets chuyên nghiệp.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Tối ưu hiệu suất</h4>
                <p className="text-base leading-relaxed">Dự án mang đậm tinh thần kỹ thuật, chú trọng vào hiệu suất và kiến trúc phần mềm mạnh mẽ để đảm bảo tốc độ cao nhất.</p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-foreground mb-4">Giá trị cốt lõi</h3>
            <ul className="list-disc pl-6 space-y-4 text-lg">
              <li><strong className="text-foreground">Chất lượng đặt lên hàng đầu:</strong> Mọi bài học, tính năng đều được chăm chút và kiểm duyệt khắt khe trước khi đến tay người dùng.</li>
              <li><strong className="text-foreground">Học tập trọn đời:</strong> Thúc đẩy văn hóa không ngừng tự học và hoàn thiện bản thân mỗi ngày.</li>
              <li><strong className="text-foreground">Cộng đồng:</strong> Môi trường trao đổi, học hỏi tích cực, không phán xét, nơi mọi câu hỏi đều được trân trọng.</li>
            </ul>
          </div>
          
          <div className="text-center pt-8 border-t">
            <p className="text-xl font-medium text-foreground italic">
              "Hãy để Góc Tri Thức trở thành bệ phóng cho sự nghiệp của bạn!"
            </p>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
