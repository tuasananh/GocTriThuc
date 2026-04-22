import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Star, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
  visibility: 'Public' | 'Restricted' | 'Private';
}

export function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await axios.get<Course[]>('/api/courses');
        setCourses(response.data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const handleCourseClick = async (courseId: number) => {
    try {
      // Check authentication status first
      await axios.get('/api/users/me');
      // If user is authenticated, navigate to course player (which doesn't exist yet but let's mock the UI logic)
      navigate(`/courses/${courseId}`);
    } catch {
      // If 401 Unauthorized or any other error, push them to login
      navigate(`/login?redirect=/courses/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-12 mb-20 animate-in fade-in duration-500">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="h-50 w-full rounded-2xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-12 mb-24">
      {courses.map((course) => (
        <Card 
          key={course.id} 
          className="group flex flex-col overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-xl hover:border-black/10 cursor-pointer rounded-2xl bg-white"
          onClick={() => handleCourseClick(course.id)}
        >
          <div className="relative aspect-video overflow-hidden bg-muted">
            <img 
              src={course.thumbnail_url} 
              alt={course.title} 
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant={course.visibility === 'Public' ? 'default' : 'secondary'} className="shadow-sm backdrop-blur-md bg-white/90 text-black border-0">
                {course.visibility === 'Public' ? 'Công khai' : 'Riêng tư'}
              </Badge>
            </div>
          </div>
          
          <CardHeader className="p-6 pb-2">
            <CardTitle className="line-clamp-2 text-xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {course.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 pt-2 grow">
            <CardDescription className="line-clamp-3 text-base text-muted-foreground leading-relaxed">
              {course.description}
            </CardDescription>
          </CardContent>
          
          <CardFooter className="p-6 pt-0 flex justify-between items-center text-sm font-medium text-muted-foreground border-t border-border/5 mt-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4" /> 12 bài</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 3h 15m</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-foreground tracking-tight">4.9</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}