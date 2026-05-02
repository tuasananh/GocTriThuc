import { CourseCatalog } from '@/pages/_components/CourseCatalog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-16 md:pt-32 md:pb-24 flex items-center justify-center text-center">
        {/* Background blobs for a modern Apple-like gradient feel */}
        <div className="absolute top-1/2 left-[20%] w-150 h-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-[20%] w-125 h-125 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

        <div className="container relative z-10 px-4 md:px-8 mx-auto flex flex-col items-center gap-6">
          <div className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-2 shadow-sm backdrop-blur-md">
            <Sparkles className="mr-2 h-4 w-4" />
            Nền tảng học tập thế hệ mới
          </div>

          <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1] md:leading-[1.15]">
            Nâng tầm tri thức với trải nghiệm{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-600">
              tuyệt đỉnh
            </span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground/80 leading-relaxed">
            Học tập đơn giản, tinh tế và hiệu quả hơn bao giờ hết. Các khóa học công nghệ chất lượng
            cao được thiết kế tỉ mỉ.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="rounded-full h-14 px-8 text-base shadow-xl hover:shadow-2xl transition-all"
            >
              <Link to="#catalog">
                Khám phá ngay <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full h-14 px-8 text-base border-border"
            >
              <Link to="/login">Trở thành học viên</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="bg-[#fafafa] border-t border-border/40 py-24 scroll-mt-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Khóa học nổi bật</h2>
              <p className="text-muted-foreground text-lg">
                Bắt đầu hành trình của bạn ngay hôm nay.
              </p>
            </div>
            <Button
              variant="ghost"
              className="hidden md:inline-flex text-primary hover:text-primary/80 transition-colors"
            >
              Xem tất cả <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <CourseCatalog />

          <div className="flex justify-center md:hidden mt-8">
            <Button variant="outline" className="w-full rounded-full h-12 border-border">
              Xem tất cả khóa học
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
