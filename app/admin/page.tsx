import AdminDashboard from '@/components/AdminDashboard';
export const metadata={title:'إدارة المحتوى',robots:{index:false,follow:false},alternates:{canonical:'/admin'}};
export default function Admin(){
  if(process.env.NODE_ENV==='production'){
    return <div className="admin wrap"><div className="admin-top"><div><span className="eyebrow">إدارة المحتوى</span><h1>اللوحة قيد الربط.</h1><p>الموقع منشور، لكن الحفظ السحابي وتسجيل دخول المالك لم يُربطا بعد. استخدم اللوحة المحلية حاليًا لإدارة المحتوى.</p></div></div></div>
  }
  return <AdminDashboard/>
}
