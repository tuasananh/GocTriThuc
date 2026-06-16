import { PageShell } from '@/components/PageShell';
import { SectionHeader } from '@/components/SectionHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function HelpPage() {
  return (
    <PageShell>
      <div className="max-w-3xl mx-auto space-y-8 mt-8">
        <SectionHeader
          title="Trung tâm Trợ giúp"
          description="Tìm câu trả lời cho các vấn đề thường gặp hoặc liên hệ với chúng tôi."
        />

        <div className="space-y-6 mt-8">
          <h2 className="text-2xl font-semibold tracking-tight">Câu hỏi thường gặp</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg">Làm thế nào để đăng ký khóa học?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                Bạn chỉ cần tạo tài khoản, đăng nhập và nhấn vào nút "Đăng ký" ở trang chi tiết của khóa học mà bạn quan tâm.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg">Tôi có thể xem lại bài học không?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                Có, một khi bạn đã đăng ký khóa học, bạn có quyền truy cập vào nội dung bài học mãi mãi và có thể xem lại bất cứ lúc nào.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg">Hệ thống có hỗ trợ cấp chứng chỉ không?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                Hiện tại hệ thống tập trung vào việc cung cấp kiến thức thực tế. Tính năng cấp chứng chỉ đang được phát triển và sẽ sớm ra mắt trong tương lai.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg">Làm sao để liên hệ với giảng viên?</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                Bạn có thể sử dụng phần bình luận dưới mỗi bài học để đặt câu hỏi. Giảng viên và cộng đồng sẽ hỗ trợ giải đáp thắc mắc của bạn.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="mt-12 p-8 bg-muted/30 rounded-xl border">
          <h3 className="text-xl font-semibold mb-3">Cần hỗ trợ thêm?</h3>
          <p className="text-muted-foreground text-lg mb-4">
            Nếu bạn không tìm thấy câu trả lời, hãy liên hệ trực tiếp với các thành viên trong đội ngũ hỗ trợ của chúng tôi:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-lg text-muted-foreground mb-6">
            <li>
              Trần Tuấn Anh -{' '}
              <a href="mailto:anh.tt2416124@sis.hust.edu.vn" className="text-primary hover:underline font-medium">
                anh.tt2416124@sis.hust.edu.vn
              </a>
            </li>
            <li>
              Phạm Văn Sâm -{' '}
              <a href="mailto:sam.pv2400114@sis.hust.edu.vn" className="text-primary hover:underline font-medium">
                sam.pv2400114@sis.hust.edu.vn
              </a>
            </li>
            <li>
              Lê Thành Trung -{' '}
              <a href="mailto:trung.lt2400076@sis.hust.edu.vn" className="text-primary hover:underline font-medium">
                trung.lt2400076@sis.hust.edu.vn
              </a>
            </li>
            <li>
              Vũ Hoàng Tuấn -{' '}
              <a href="mailto:tuan.vh2400080@sis.hust.edu.vn" className="text-primary hover:underline font-medium">
                tuan.vh2400080@sis.hust.edu.vn
              </a>
            </li>
            <li>
              Nguyễn Công Vinh -{' '}
              <a href="mailto:vinh.nc2400083@sis.hust.edu.vn" className="text-primary hover:underline font-medium">
                vinh.nc2400083@sis.hust.edu.vn
              </a>
            </li>
          </ul>
          <p className="text-muted-foreground text-lg">
            * Nếu muốn đăng ký làm giảng viên, hãy gửi email trực tiếp cho ngài Kilkuwu qua địa chỉ:{' '}
            <a href="mailto:anh.tt2416124@sis.hust.edu.vn" className="text-primary hover:underline font-medium">
              anh.tt2416124@sis.hust.edu.vn
            </a>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
