import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

const teamMembers = [
  {
    name: "Dr. Ahmad Fauzi, M.Si",
    role: "Kepala Laboratorium",
    initials: "AF",
    image: "/placeholder-avatar-1.jpg",
  },
  {
    name: "Ir. Siti Rahayu, M.P",
    role: "Koordinator Budidaya",
    initials: "SR",
    image: "/placeholder-avatar-2.jpg",
  },
  {
    name: "Bambang Suryanto, S.Pi",
    role: "Teknisi Senior",
    initials: "BS",
    image: "/placeholder-avatar-3.jpg",
  },
  {
    name: "Dewi Lestari, S.St",
    role: "Analis Laboratorium",
    initials: "DL",
    image: "/placeholder-avatar-4.jpg",
  },
]

export function OrganisasiSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-800 sm:text-4xl">
          Struktur Organisasi
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          Tim profesional yang berdedikasi untuk mendukung kegiatan laboratorium
          dan penelitian perikanan
        </p>

        <div className="mt-12 flex flex-col items-center gap-8">
          {/* Top - Kepala Lab */}
          <div className="flex justify-center">
            <ProfileCard member={teamMembers[0]} featured />
          </div>

          {/* Bottom row - 3 members */}
          <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.slice(1).map((member) => (
              <ProfileCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProfileCard({
  member,
  featured = false,
}: {
  member: (typeof teamMembers)[0]
  featured?: boolean
}) {
  return (
    <Card
      className={`group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        featured ? "shadow-lg shadow-slate-200" : "shadow-md shadow-slate-100"
      }`}
    >
      <CardContent className="flex flex-col items-center p-6 text-center">
        <Avatar
          className={`${featured ? "size-24" : "size-20"} ring-4 ring-blue-100 transition-all group-hover:ring-blue-200`}
        >
          <AvatarImage src={member.image} alt={member.name} />
          <AvatarFallback className="bg-blue-600 text-lg font-semibold text-white">
            {member.initials}
          </AvatarFallback>
        </Avatar>
        <h3
          className={`mt-4 font-semibold text-slate-800 ${featured ? "text-lg" : "text-base"}`}
        >
          {member.name}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{member.role}</p>
      </CardContent>
    </Card>
  )
}
