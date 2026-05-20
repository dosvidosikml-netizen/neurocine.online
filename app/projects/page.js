import ProjectsCenter from "../../components/projects/ProjectsCenter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Библиотека проектов — NeuroCine",
  description: "Cloud Projects и snapshots NeuroCine",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectsPage() {
  return <ProjectsCenter />;
}
