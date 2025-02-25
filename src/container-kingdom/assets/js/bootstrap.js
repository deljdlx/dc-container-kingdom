console.log(
	`%cWanna see some of my projects ? https://github.com/deljdlx`,  `
	color: #FFA;
	font-size: 30px;
	text-align: center;
	border: 1px solid #FFA;
	border-radius: 5px;
	padding: 200px 100px;
	background: linear-gradient(to bottom,  #101727 0%,#233645 100%);
	background:
		radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.15) 30%, rgba(255,255,255,.3) 32%, rgba(255,255,255,0) 53%) 0 0,
		radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.1) 11%, rgba(255,255,255,.2) 13%, rgba(255,255,255,0) 14%) 0 0,
		radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.2) 17%, rgba(255,255,255,.3) 19%, rgba(255,255,255,0) 20%) 0 110px,
		radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.2) 11%, rgba(255,255,255,.3) 13%, rgba(255,255,255,0) 14%) -130px -170px,
		radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.2) 11%, rgba(255,255,255,.4) 13%, rgba(255,255,255,0) 14%) 300px 370px,
		radial-gradient(rgba(255,255,255,0) 0, rgba(255,255,255,.1) 11%, rgba(255,255,255,.2) 13%, rgba(255,255,255,0) 14%) 0 0,
		linear-gradient(to bottom,  #101727 0%,#233645 100%);
		background-size: 1470px 1470px, 970px 970px, 410px 410px, 610px 610px, 530px 530px, 200px 200px, 100% 100%;
		background-color: #840b2a;
		background-repeat: no-repeat;
	`
);


document.addEventListener('DOMContentLoaded', async () => {
  const dockerApiClient = new DockerApiClient();
  const instance = new ContainerKingdom(dockerApiClient);
  instance.zoom(0.5);
});
