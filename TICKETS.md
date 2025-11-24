Let's make a website that allows the user to keep track of reserach linked to a certain project. We'll be adding inspiration, sketches, research elements and notes, and technologie references. The platform allows for collaboration on the projects


[x] As a user, I can create a new account, with a username, my first name, last name, email and password
[x] As a user, I can log in using my username or email, and password.
[x] As a user, I can change my password and other information on a settings page
[x] As a user, I can log out.
[x] As a user, I can add a new project, giving it a name, client, and deadline
[x] As a user, I can invite another user to collaborate on a project.

[x] As a user, I can invite a collaborator on a project using their email address.
[x] As a user, I can remove a collaborator from a project
[x] As a collaborator, I can remove myself from a project
[x] As a user, I can see who added which elements to the project.
[x] As a user, I can click on a project, and see the detail page.

[x] As a user, I can add a new research stack to a project, assigning it a topic, using the `/stack [topic]` command in the chat
	This page is split in two, containing a chat window on the left, and a table view on the right.
	A stack is a collection of insights about a topic,
[x] As a user, I can open a different chat window per stack within the project
[x] As a user, I can add an insight to the stack using the chat window. I can do this using a command in the chat window: `/insight [text of the insight]`
	The insight is then linked to the research stack. I can see the insights in the right. hand table.
[x] As a user, I can see messages and insights added by collaborators on stacks

[x] As a user, I can add tags to insights
[x] As a user, I can filter insights based on tags
[x] As a user, I can search for insights using keywords

[x] As a user, I want to be able to add images to a research stack, using the
  command `/image [name of the image]`. When I use this command, I get a popup to
  upload a file and (optional) assign a tag to the image. The image can be be
  found in a separate table, using tabs (insights, images) in the right hand
[x] As a user, f I click on an image, I see an overlay with the enlarged image, I
  can go to the next or previous image

[x] Change the input to scale with multiline (text-wrap)
