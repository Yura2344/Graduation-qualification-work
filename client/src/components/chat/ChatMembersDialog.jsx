import { MoreVert } from "@mui/icons-material";
import { Avatar, Card, CardHeader, Dialog, DialogContent, DialogTitle, IconButton, Link, Typography } from "@mui/material";

export default function ChatMembersDialog({open, setIsOpen, members}){

  return (
    <Dialog open={open} onClose={() => setIsOpen(false)}>
        <DialogTitle>Members</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
          {
            open && members.map((member) => (
              <Card key={member.id} elevation={3} >

                <CardHeader
                  avatar={<Link href={`/users/${member.username}`}><Avatar src={member.avatarURL} /></Link>}
                  title={<Link href={`/users/${member.username}`} underline="none" color="text.primary">
                    <Typography>{member.username}</Typography>
                  </Link>
                  }
                  action={<IconButton>
                    <MoreVert />
                  </IconButton>}
                />
              </Card>
            ))
          }
        </DialogContent>
      </Dialog>
  );
}