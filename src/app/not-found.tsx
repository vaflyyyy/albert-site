import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-28 text-center">
      <p className="eyebrow">Ошибка 404</p>
      <h1 className="mt-3 text-5xl">Страница не найдена</h1>
      <p className="mt-4 text-mist">Возможно, ссылка устарела. Вернитесь на главную.</p>
      <Link href="/" className="btn btn-primary mt-8">На главную</Link>
    </div>
  );
}
